import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { generateTempPassword, hashPassword } from "@/lib/password";
import { sendFromTemplate } from "@/lib/notifications";
import { audit, getRequestInfo } from "@/lib/audit";
import type { RoleName } from "@prisma/client";

const schema = z.object({
  name: z.string().min(1).optional(),
  active: z.boolean().optional(),
  roles: z.array(z.enum(["ADMIN", "INVENTARIO", "CLIENTE"])).optional(),
  resetPassword: z.boolean().optional(),
});

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: { roles: { include: { role: true } }, client: true },
  });
  if (!user) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { error, user: admin } = await requireRole("ADMIN");
  if (error) return error;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { name, active, roles, resetPassword } = parsed.data;

  const before = await prisma.user.findUnique({
    where: { id: params.id },
    include: { roles: { include: { role: true } } },
  });
  if (!before) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.user.update({ where: { id: params.id }, data: { name, active } });
    if (roles) {
      await tx.userRole.deleteMany({ where: { userId: params.id } });
      const roleRecords = await tx.role.findMany({ where: { name: { in: roles as RoleName[] } } });
      await tx.userRole.createMany({ data: roleRecords.map((r) => ({ userId: params.id, roleId: r.id })) });
    }
    return u;
  });

  const { ip, userAgent } = getRequestInfo(req);

  // Snapshot "after" con roles actualizados para diff
  const afterSnap = await prisma.user.findUnique({
    where: { id: params.id },
    include: { roles: { include: { role: true } } },
  });

  // Simplificar roles para diff
  const beforeLite = { ...before, roles: before.roles.map((r) => r.role.name), passwordHash: undefined };
  const afterLite = { ...afterSnap!, roles: afterSnap!.roles.map((r) => r.role.name), passwordHash: undefined };
  await audit({ userId: admin?.id, action: "UPDATE", entity: "User", entityId: updated.id, before: beforeLite, after: afterLite, ipAddress: ip, userAgent });

  if (resetPassword) {
    const temp = generateTempPassword();
    await prisma.user.update({
      where: { id: params.id },
      data: { passwordHash: await hashPassword(temp), mustChangePassword: true },
    });
    const loginUrl = process.env.NEXTAUTH_URL ? `${process.env.NEXTAUTH_URL}/login` : "http://localhost:3000/login";
    await sendFromTemplate({
      templateCode: "NEW_USER_PASSWORD",
      recipient: updated.email,
      vars: { name: updated.name, email: updated.email, password: temp, loginUrl },
      channelOverride: "EMAIL",
      relatedType: "User",
      relatedId: updated.id,
    });
    await audit({ userId: admin?.id, action: "PASSWORD_RESET", entity: "User", entityId: updated.id, ipAddress: ip, userAgent });
  }

  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { error, user: admin } = await requireRole("ADMIN");
  if (error) return error;

  // No permitir que se borre a sí mismo
  if (admin?.id === params.id) {
    return NextResponse.json({ error: "No puedes borrar tu propio usuario" }, { status: 400 });
  }

  const before = await prisma.user.findUnique({
    where: { id: params.id },
    include: { roles: { include: { role: true } }, client: true },
  });
  if (!before) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  await prisma.user.delete({ where: { id: params.id } });

  const { ip, userAgent } = getRequestInfo(req);
  const beforeLite = { ...before, roles: before.roles.map((r) => r.role.name), passwordHash: undefined };
  await audit({ userId: admin?.id, action: "DELETE", entity: "User", entityId: before.id, before: beforeLite, ipAddress: ip, userAgent });
  return NextResponse.json({ ok: true });
}
