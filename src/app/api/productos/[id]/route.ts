import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ADMIN_OR_INV, requireRole } from "@/lib/rbac";
import { audit, getRequestInfo } from "@/lib/audit";

const schema = z.object({
  sku: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  features: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  costPrice: z.coerce.number().nonnegative().optional(),
  salePrice: z.coerce.number().nonnegative().optional(),
  minStock: z.coerce.number().int().nonnegative().optional(),
  warrantyDays: z.coerce.number().int().nonnegative().optional(),
  active: z.boolean().optional(),
});

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireRole(ADMIN_OR_INV);
  if (error) return error;
  const p = await prisma.product.findUnique({
    where: { id: params.id },
    include: { category: true, movements: { orderBy: { occurredAt: "desc" }, take: 50 } },
  });
  if (!p) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(p);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { error, user } = await requireRole(ADMIN_OR_INV);
  if (error) return error;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const before = await prisma.product.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const updated = await prisma.product.update({ where: { id: params.id }, data: parsed.data });
  const { ip, userAgent } = getRequestInfo(req);
  await audit({ userId: user?.id, action: "UPDATE", entity: "Product", entityId: updated.id, before, after: updated, ipAddress: ip, userAgent });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { error, user } = await requireRole("ADMIN");
  if (error) return error;

  const before = await prisma.product.findUnique({
    where: { id: params.id },
    include: { category: true, _count: { select: { movements: true, saleItems: true, warranties: true } } },
  });
  if (!before) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  try {
    await prisma.product.delete({ where: { id: params.id } });
  } catch (e: any) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return NextResponse.json(
        { error: "El producto tiene ventas o garantías asociadas. Desactívalo en lugar de borrarlo." },
        { status: 409 },
      );
    }
    throw e;
  }

  const { ip, userAgent } = getRequestInfo(req);
  await audit({ userId: user?.id, action: "DELETE", entity: "Product", entityId: before.id, before, ipAddress: ip, userAgent });
  return NextResponse.json({ ok: true });
}
