import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ADMIN_OR_INV, requireRole } from "@/lib/rbac";
import { audit, getRequestInfo } from "@/lib/audit";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireRole(ADMIN_OR_INV);
  if (error) return error;
  const sale = await prisma.sale.findUnique({
    where: { id: params.id },
    include: {
      client: true,
      items: { include: { product: true } },
      warranties: true,
    },
  });
  if (!sale) return NextResponse.json({ error: "No existe" }, { status: 404 });
  return NextResponse.json(sale);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { error, user } = await requireRole(["ADMIN"]);
  if (error) return error;

  const sale = await prisma.sale.findUnique({
    where: { id: params.id },
    include: { items: true },
  });
  if (!sale) return NextResponse.json({ error: "No existe" }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    // Revertir movimientos de inventario: agregar DEVOLUCION por cada item
    for (const it of sale.items) {
      await tx.inventoryMovement.create({
        data: {
          productId: it.productId,
          type: "DEVOLUCION",
          quantity: it.quantity,
          reference: `Reverso venta ${sale.id}`,
          notes: "Eliminación de venta",
        },
      });
    }
    // Borrar garantías asociadas y la venta (cascada borra items)
    await tx.warranty.deleteMany({ where: { saleId: sale.id } });
    await tx.sale.delete({ where: { id: sale.id } });
  });

  const { ip, userAgent } = getRequestInfo(req);
  await audit({ userId: user?.id, action: "DELETE", entity: "Sale", entityId: sale.id, before: sale, ipAddress: ip, userAgent });

  return NextResponse.json({ ok: true });
}
