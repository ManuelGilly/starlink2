import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ADMIN_OR_INV, requireRole } from "@/lib/rbac";
import { audit, getRequestInfo } from "@/lib/audit";
import { stockForProduct } from "@/lib/inventory/stock";

const itemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
  unitPrice: z.coerce.number().nonnegative().optional(), // si no viene, usa salePrice del producto
});

const schema = z.object({
  clientId: z.string().min(1),
  items: z.array(itemSchema).min(1),
  occurredAt: z.string().optional(), // ISO o yyyy-mm-dd; si no viene, ahora
  paidAt: z.string().optional(),
  notes: z.string().nullable().optional(),
  createWarranties: z.boolean().optional().default(true),
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

  const { clientId, items, occurredAt, paidAt, notes, createWarranties } = parsed.data;

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) return NextResponse.json({ error: "Cliente no existe" }, { status: 400 });

  // Cargar productos en una sola query
  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  if (products.length !== productIds.length) {
    return NextResponse.json({ error: "Algún producto no existe" }, { status: 400 });
  }

  // Validar stock disponible (al momento de la venta — sin proyección por fecha)
  for (const item of items) {
    const stock = await stockForProduct(item.productId);
    if (stock < item.quantity) {
      const p = products.find((p) => p.id === item.productId);
      return NextResponse.json(
        { error: `Stock insuficiente para ${p?.name ?? item.productId} (disponible: ${stock}, requerido: ${item.quantity})` },
        { status: 400 },
      );
    }
  }

  const eventDate = occurredAt ? new Date(occurredAt) : new Date();
  if (Number.isNaN(eventDate.getTime())) {
    return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });
  }

  // Construir items con precios y subtotales
  const itemsResolved = items.map((it) => {
    const p = products.find((pp) => pp.id === it.productId)!;
    const unitPrice = it.unitPrice ?? Number(p.salePrice);
    return {
      productId: it.productId,
      quantity: it.quantity,
      unitPrice,
      subtotal: unitPrice * it.quantity,
      warrantyDays: p.warrantyDays,
    };
  });
  const total = itemsResolved.reduce((acc, it) => acc + it.subtotal, 0);

  const sale = await prisma.$transaction(async (tx) => {
    const created = await tx.sale.create({
      data: {
        clientId,
        total,
        paidAt: paidAt ? new Date(paidAt) : eventDate,
        notes: notes ?? undefined,
        createdAt: eventDate, // permite registrar compras pasadas
        items: {
          create: itemsResolved.map((it) => ({
            productId: it.productId,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            subtotal: it.subtotal,
          })),
        },
      },
      include: { items: true },
    });

    // Movimientos de inventario (SALIDA) por cada item
    for (const it of itemsResolved) {
      await tx.inventoryMovement.create({
        data: {
          productId: it.productId,
          type: "SALIDA",
          quantity: it.quantity,
          reference: `Venta ${created.id}`,
          occurredAt: eventDate,
        },
      });
    }

    // Garantías opcionales
    if (createWarranties) {
      for (const it of itemsResolved) {
        if (it.warrantyDays > 0) {
          for (let i = 0; i < it.quantity; i++) {
            const startsAt = eventDate;
            const endsAt = new Date(startsAt);
            endsAt.setDate(endsAt.getDate() + it.warrantyDays);
            await tx.warranty.create({
              data: {
                clientId,
                productId: it.productId,
                saleId: created.id,
                startsAt,
                endsAt,
              },
            });
          }
        }
      }
    }

    return created;
  });

  const { ip, userAgent } = getRequestInfo(req);
  await audit({ userId: user?.id, action: "CREATE", entity: "Sale", entityId: sale.id, after: sale, ipAddress: ip, userAgent });

  return NextResponse.json(sale, { status: 201 });
}
