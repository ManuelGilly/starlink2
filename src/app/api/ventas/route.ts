import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ADMIN_OR_INV, requireRole } from "@/lib/rbac";
import { audit, getRequestInfo } from "@/lib/audit";
import { stockForProduct } from "@/lib/inventory/stock";
import { lastLotLandedCost } from "@/lib/inventory/cost";
import { normalizeSplits, type SplitInput } from "@/lib/payments/splits";
import { sendFromTemplate, sendToAdmin } from "@/lib/notifications";
import { formatUSD } from "@/lib/utils";

const itemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
  unitPrice: z.coerce.number().nonnegative().optional(), // si no viene, usa salePrice del producto
  unitId: z.string().optional().nullable(), // unidad serializada concreta (productos serializados)
  unitCost: z.coerce.number().nonnegative().optional().nullable(), // override de costo (no serializados)
});

const splitSchema = z.object({
  method: z.enum(["ZELLE", "PAYPAL", "BINANCE", "EFECTIVO_USD", "TRANSFERENCIA_USD", "PAGO_MOVIL", "OTRO"]),
  amountUSD: z.coerce.number().nonnegative().optional().nullable(),
  amountVes: z.coerce.number().nonnegative().optional().nullable(),
  vesRate: z.coerce.number().positive().optional().nullable(),
  reference: z.string().optional().nullable(),
});

const schema = z.object({
  clientId: z.string().min(1),
  items: z.array(itemSchema).min(1),
  occurredAt: z.string().optional(), // ISO o yyyy-mm-dd; si no viene, ahora
  paidAt: z.string().optional(),
  notes: z.string().nullable().optional(),
  createWarranties: z.boolean().optional().default(true),
  origin: z.enum(["ORGANICO", "INSTAGRAM_ADS", "RECOMENDADO"]).optional().default("ORGANICO"),
  campaignId: z.string().optional(),
  // Pago opcional: si viene, se crea un Payment vinculado a la venta.
  splits: z.array(splitSchema).optional(),
});

export async function GET(req: Request) {
  const { error } = await requireRole(ADMIN_OR_INV);
  if (error) return error;
  const url = new URL(req.url);
  const clientId = url.searchParams.get("clientId");
  const sales = await prisma.sale.findMany({
    where: clientId ? { clientId } : undefined,
    include: {
      client: true,
      items: { include: { product: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json(sales);
}

export async function POST(req: Request) {
  const { error, user } = await requireRole(ADMIN_OR_INV);
  if (error) return error;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { clientId, items, occurredAt, paidAt, notes, createWarranties, origin, campaignId, splits } = parsed.data;
  const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) return NextResponse.json({ error: "Cliente no existe" }, { status: 400 });

  // Cargar productos en una sola query
  const productIds = [...new Set(items.map((i) => i.productId))];
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  const productById = new Map(products.map((p) => [p.id, p]));
  if (productById.size !== productIds.length) {
    return NextResponse.json({ error: "Algún producto no existe" }, { status: 400 });
  }

  // Validación de productos serializados: cada línea exige una unidad concreta.
  const unitIds = new Set<string>();
  for (const item of items) {
    const p = productById.get(item.productId)!;
    if (p.serialized) {
      if (!item.unitId) {
        return NextResponse.json({ error: `Selecciona la unidad (serial) de "${p.name}"` }, { status: 400 });
      }
      if (item.quantity !== 1) {
        return NextResponse.json({ error: `Cada unidad serializada va en su propia línea (cantidad 1): "${p.name}"` }, { status: 400 });
      }
      if (unitIds.has(item.unitId)) {
        return NextResponse.json({ error: "Hay una unidad repetida en la venta" }, { status: 400 });
      }
      unitIds.add(item.unitId);
    }
  }

  // Cargar y validar unidades serializadas.
  const unitById = new Map<string, any>();
  if (unitIds.size) {
    const units = await prisma.equipment.findMany({ where: { id: { in: [...unitIds] } } });
    for (const u of units) unitById.set(u.id, u);
    for (const item of items) {
      if (!item.unitId) continue;
      const u = unitById.get(item.unitId);
      if (!u) return NextResponse.json({ error: "Unidad no encontrada" }, { status: 400 });
      if (u.productId !== item.productId) {
        return NextResponse.json({ error: "La unidad no pertenece al producto seleccionado" }, { status: 400 });
      }
      if (u.availability !== "DISPONIBLE") {
        return NextResponse.json({ error: `La unidad ${u.serialNumber ?? u.id} no está disponible` }, { status: 400 });
      }
    }
  }

  // Validar stock disponible para productos NO serializados.
  for (const item of items) {
    const p = productById.get(item.productId)!;
    if (p.serialized) continue;
    const stock = await stockForProduct(item.productId);
    if (stock < item.quantity) {
      return NextResponse.json(
        { error: `Stock insuficiente para ${p.name} (disponible: ${stock}, requerido: ${item.quantity})` },
        { status: 400 },
      );
    }
  }

  const eventDate = occurredAt ? new Date(occurredAt) : new Date();
  if (Number.isNaN(eventDate.getTime())) {
    return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });
  }

  // Resolver precio y COSTO REAL (landed) por línea para calcular la ganancia.
  const itemsResolved = [] as Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    warrantyDays: number;
    serialized: boolean;
    unitId: string | null;
    serial: string | null;
    unitCost: number | null;
  }>;
  for (const it of items) {
    const p = productById.get(it.productId)!;
    const unitPrice = it.unitPrice ?? Number(p.salePrice);
    let unitCost: number | null;
    let serial: string | null = null;
    if (p.serialized) {
      const u = unitById.get(it.unitId!);
      unitCost = u.landedCost != null ? Number(u.landedCost) : Number(p.costPrice);
      serial = u.serialNumber ?? null;
    } else if (it.unitCost != null) {
      unitCost = Number(it.unitCost);
    } else {
      const last = await lastLotLandedCost(p.id);
      unitCost = last ?? Number(p.costPrice);
    }
    itemsResolved.push({
      productId: it.productId,
      quantity: it.quantity,
      unitPrice,
      subtotal: round2(unitPrice * it.quantity),
      warrantyDays: p.warrantyDays,
      serialized: p.serialized,
      unitId: it.unitId ?? null,
      serial,
      unitCost,
    });
  }
  const total = round2(itemsResolved.reduce((acc, it) => acc + it.subtotal, 0));

  // Validar splits del pago (si vienen) antes de la transacción.
  let payment: { totalUSD: number; splits: ReturnType<typeof normalizeSplits>["splits"] } | null = null;
  if (splits && splits.length > 0) {
    try {
      payment = normalizeSplits(splits as SplitInput[]);
    } catch (e: any) {
      return NextResponse.json({ error: e.message ?? "Pago inválido" }, { status: 400 });
    }
  }

  const sale = await prisma.$transaction(async (tx) => {
    const created = await tx.sale.create({
      data: {
        clientId,
        total,
        paidAt: paidAt ? new Date(paidAt) : eventDate,
        notes: notes ?? undefined,
        origin,
        campaignId: campaignId ?? undefined,
        createdAt: eventDate, // permite registrar compras pasadas
      },
    });

    for (const it of itemsResolved) {
      const saleItem = await tx.saleItem.create({
        data: {
          saleId: created.id,
          productId: it.productId,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          subtotal: it.subtotal,
          unitCostSnapshot: it.unitCost,
          costTotal: it.unitCost != null ? round2(it.unitCost * it.quantity) : null,
        },
      });

      // SALIDA de inventario (mantiene stock.ts consistente para todos los productos)
      await tx.inventoryMovement.create({
        data: {
          productId: it.productId,
          type: "SALIDA",
          quantity: it.quantity,
          reference: `Venta ${created.id}`,
          occurredAt: eventDate,
        },
      });

      // Producto serializado: marcar la unidad como VENDIDA y vincularla a la línea.
      if (it.unitId) {
        await tx.equipment.update({
          where: { id: it.unitId },
          data: { availability: "VENDIDO", clientId, saleItemId: saleItem.id },
        });
      }

      // Garantías opcionales
      if (createWarranties && it.warrantyDays > 0) {
        if (it.serialized) {
          const endsAt = new Date(eventDate);
          endsAt.setDate(endsAt.getDate() + it.warrantyDays);
          await tx.warranty.create({
            data: { clientId, productId: it.productId, saleId: created.id, serialNumber: it.serial ?? undefined, startsAt: eventDate, endsAt },
          });
        } else {
          for (let i = 0; i < it.quantity; i++) {
            const endsAt = new Date(eventDate);
            endsAt.setDate(endsAt.getDate() + it.warrantyDays);
            await tx.warranty.create({
              data: { clientId, productId: it.productId, saleId: created.id, startsAt: eventDate, endsAt },
            });
          }
        }
      }
    }

    // Pago vinculado a la venta (con splits + Bs).
    if (payment) {
      await tx.payment.create({
        data: {
          clientId,
          saleId: created.id,
          amount: payment.totalUSD,
          method: payment.splits[0].method,
          reference: payment.splits[0].reference,
          status: "CONFIRMADO",
          paidAt: paidAt ? new Date(paidAt) : eventDate,
          confirmedAt: new Date(),
          confirmedBy: user?.id ?? null,
          splits: { create: payment.splits },
        },
      });
    }

    return tx.sale.findUnique({ where: { id: created.id }, include: { items: true } });
  });

  if (!sale) return NextResponse.json({ error: "No se pudo crear la venta" }, { status: 500 });

  const { ip, userAgent } = getRequestInfo(req);
  await audit({ userId: user?.id, action: "CREATE", entity: "Sale", entityId: sale.id, after: sale, ipAddress: ip, userAgent });

  const itemsList = itemsResolved
    .map((it) => {
      const p = products.find((pp) => pp.id === it.productId);
      return `${it.quantity}x ${p?.name ?? it.productId}`;
    })
    .join(", ");
  const dateStr = eventDate.toLocaleDateString("es-VE");
  const totalStr = formatUSD(total);
  const clientName = `${client.firstName} ${client.lastName}`;

  if (client.telegramChatId) {
    try {
      await sendFromTemplate({
        templateCode: "SALE_REGISTERED_CLIENT",
        recipient: client.telegramChatId,
        channelOverride: "TELEGRAM",
        vars: { firstName: client.firstName, itemsList, total: totalStr, date: dateStr },
        relatedType: "Sale",
        relatedId: sale.id,
      });
    } catch (e) {
      console.error("[notif] SALE_REGISTERED_CLIENT falló:", e);
    }
  }

  try {
    await sendToAdmin({
      templateCode: "SALE_REGISTERED_ADMIN",
      vars: { clientName, total: totalStr, itemsList, date: dateStr },
      relatedType: "Sale",
      relatedId: sale.id,
    });
  } catch (e) {
    console.error("[notif] SALE_REGISTERED_ADMIN falló:", e);
  }

  return NextResponse.json(sale, { status: 201 });
}
