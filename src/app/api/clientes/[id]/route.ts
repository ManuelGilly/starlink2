import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ADMIN_OR_INV, requireRole } from "@/lib/rbac";
import { audit, getRequestInfo } from "@/lib/audit";

const schema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  documentId: z.string().nullable().optional(),
  email: z.string().email().optional(),
  phone: z.string().min(1).optional(),
  address: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  telegramChatId: z.string().nullable().optional().transform((v) => v || null),
  userId: z.string().nullable().optional(),
});

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireRole(ADMIN_OR_INV);
  if (error) return error;
  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      subscriptions: { include: { plan: true } },
      payments: { orderBy: { createdAt: "desc" }, take: 50 },
      warranties: { include: { product: true } },
      sales: { include: { items: { include: { product: true } } }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!client) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(client);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { error, user } = await requireRole(ADMIN_OR_INV);
  if (error) return error;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const before = await prisma.client.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const updated = await prisma.client.update({ where: { id: params.id }, data: parsed.data });
  const { ip, userAgent } = getRequestInfo(req);
  await audit({ userId: user?.id, action: "UPDATE", entity: "Client", entityId: updated.id, before, after: updated, ipAddress: ip, userAgent });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { error, user } = await requireRole("ADMIN");
  if (error) return error;

  // Estado completo (con relaciones) ANTES de borrar, para bitácora
  const before = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      subscriptions: true,
      payments: true,
      warranties: true,
      sales: { include: { items: true } },
    },
  });
  if (!before) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  // La cascada borra subs, payments, warranties, sales asociados (ver schema)
  await prisma.client.delete({ where: { id: params.id } });

  const { ip, userAgent } = getRequestInfo(req);
  await audit({ userId: user?.id, action: "DELETE", entity: "Client", entityId: before.id, before, ipAddress: ip, userAgent });
  return NextResponse.json({ ok: true });
}
