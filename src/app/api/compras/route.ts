import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ADMIN_OR_INV, getCurrentUser, requireRole } from "@/lib/rbac";
import { audit, getRequestInfo } from "@/lib/audit";
import { resolveLotCosts } from "@/lib/inventory/cost";

const chargeSchema = z.object({
  applies: z.boolean().default(false),
  mode: z.enum(["FIXED", "PERCENT"]).optional().nullable(),
  value: z.coerce.number().nonnegative().optional().nullable(),
});

const schema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
  baseUnitCost: z.coerce.number().nonnegative(),
  freight: chargeSchema.optional().default({ applies: false }),
  tax: chargeSchema.optional().default({ applies: false }),
  reference: z.string().optional().nullable(),
  purchasedAt: z.string().optional(),
  notes: z.string().optional().nullable(),
  // Seriales opcionales para productos serializados (una por unidad).
  serials: z.array(z.string().trim()).optional().default([]),
});

export async function GET(req: Request) {
  const { error } = await requireRole(ADMIN_OR_INV);
  if (error) return error;
  const url = new URL(req.url);
  const productId = url.searchParams.get("productId");
  const lots = await prisma.purchaseLot.findMany({
    where: productId ? { productId } : undefined,
    include: { product: true, _count: { select: { units: true } } },
    orderBy: { purchasedAt: "desc" },
    take: 100,
  });
  return NextResponse.json(lots);
}

export async function POST(req: Request) {
  const { error } = await requireRole(ADMIN_OR_INV);
  if (error) return error;
  const user = await getCurrentUser();

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const data = parsed.data;

  const product = await prisma.product.findUnique({ where: { id: data.productId } });
  if (!product) return NextResponse.json({ error: "Producto no existe" }, { status: 400 });

  // Validación de cargos: si aplica, requiere modo y valor.
  for (const [label, c] of [["Flete", data.freight], ["Impuesto", data.tax]] as const) {
    if (c.applies && (!c.mode || c.value == null)) {
      return NextResponse.json({ error: `${label}: indica modo (fijo/%) y valor` }, { status: 400 });
    }
  }

  // Seriales: solo para serializados; si vienen, deben coincidir con la cantidad y ser únicos.
  let serials: string[] = [];
  if (product.serialized && data.serials.length > 0) {
    serials = data.serials.filter((s) => s.length > 0);
    if (serials.length !== data.quantity) {
      return NextResponse.json(
        { error: `Debes indicar ${data.quantity} seriales (o ninguno) — recibidos ${serials.length}` },
        { status: 400 },
      );
    }
    const dup = serials.find((s, i) => serials.indexOf(s) !== i);
    if (dup) return NextResponse.json({ error: `Serial duplicado en el lote: ${dup}` }, { status: 400 });
    const existing = await prisma.equipment.findMany({ where: { serialNumber: { in: serials } }, select: { serialNumber: true } });
    if (existing.length) {
      return NextResponse.json({ error: `Serial ya registrado: ${existing[0].serialNumber}` }, { status: 400 });
    }
  }

  const costs = resolveLotCosts({
    quantity: data.quantity,
    baseUnitCost: data.baseUnitCost,
    freight: data.freight,
    tax: data.tax,
  });

  const purchasedAt = data.purchasedAt ? new Date(data.purchasedAt) : new Date();
  if (Number.isNaN(purchasedAt.getTime())) {
    return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    // 1) Movimiento ENTRADA con el costo landed unitario (mantiene stock.ts como fuente única).
    const movement = await tx.inventoryMovement.create({
      data: {
        productId: data.productId,
        type: "ENTRADA",
        quantity: data.quantity,
        unitCost: costs.landedUnitCost,
        reference: data.reference ?? null,
        notes: data.notes ?? null,
        occurredAt: purchasedAt,
      },
    });

    // 2) Lote de compra con costos resueltos.
    const lot = await tx.purchaseLot.create({
      data: {
        productId: data.productId,
        reference: data.reference ?? null,
        purchasedAt,
        quantity: data.quantity,
        baseUnitCost: data.baseUnitCost,
        baseTotal: costs.baseTotal,
        freightApplies: data.freight.applies,
        freightMode: data.freight.applies ? data.freight.mode ?? null : null,
        freightValue: data.freight.applies ? data.freight.value ?? null : null,
        freightTotalUSD: costs.freightTotalUSD,
        taxApplies: data.tax.applies,
        taxMode: data.tax.applies ? data.tax.mode ?? null : null,
        taxValue: data.tax.applies ? data.tax.value ?? null : null,
        taxTotalUSD: costs.taxTotalUSD,
        landedTotal: costs.landedTotal,
        landedUnitCost: costs.landedUnitCost,
        notes: data.notes ?? null,
        createdBy: user?.id ?? null,
        movementId: movement.id,
      },
    });

    // 3) Productos serializados: crear N unidades DISPONIBLE con su landedCost.
    if (product.serialized) {
      await tx.equipment.createMany({
        data: Array.from({ length: data.quantity }, (_, i) => ({
          model: product.name,
          productId: product.id,
          lotId: lot.id,
          landedCost: costs.landedUnitCost,
          availability: "DISPONIBLE" as const,
          condition: "NUEVO" as const,
          serialNumber: serials[i] ?? null,
          purchaseDate: purchasedAt,
        })),
      });
    }

    // 4) Cachear el último costo landed en el producto (legacy / móvil).
    await tx.product.update({
      where: { id: product.id },
      data: { costPrice: costs.landedUnitCost },
    });

    return { lot, movement };
  });

  const { ip, userAgent } = getRequestInfo(req);
  await audit({ userId: user?.id, action: "CREATE", entity: "PurchaseLot", entityId: result.lot.id, after: result.lot, ipAddress: ip, userAgent });

  return NextResponse.json(result.lot, { status: 201 });
}
