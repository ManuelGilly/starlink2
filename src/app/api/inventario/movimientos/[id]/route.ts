import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ADMIN_OR_INV, requireRole } from "@/lib/rbac";
import { audit, getRequestInfo } from "@/lib/audit";

const schema = z.object({
  type: z.enum(["ENTRADA", "SALIDA", "AJUSTE", "MERMA", "DEVOLUCION"]).optional(),
  quantity: z.coerce.number().int().optional(),
  unitCost: z.coerce.number().nonnegative().nullable().optional(),
  reference: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  occurredAt: z.string().datetime().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { error, user } = await requireRole(ADMIN_OR_INV);
  if (error) return error;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const before = await prisma.inventoryMovement.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const data: any = { ...parsed.data };
  if (data.occurredAt) data.occurredAt = new Date(data.occurredAt);

  const updated = await prisma.inventoryMovement.update({ where: { id: params.id }, data });
  const { ip, userAgent } = getRequestInfo(req);
  await audit({ userId: user?.id, action: "UPDATE", entity: "InventoryMovement", entityId: updated.id, before, after: updated, ipAddress: ip, userAgent });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { error, user } = await requireRole("ADMIN");
  if (error) return error;

  const before = await prisma.inventoryMovement.findUnique({
    where: { id: params.id },
    include: { product: true },
  });
  if (!before) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  await prisma.inventoryMovement.delete({ where: { id: params.id } });

  const { ip, userAgent } = getRequestInfo(req);
  await audit({ userId: user?.id, action: "DELETE", entity: "InventoryMovement", entityId: before.id, before, ipAddress: ip, userAgent });
  return NextResponse.json({ ok: true });
}
