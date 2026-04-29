import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { generateTempPassword, hashPassword } from "@/lib/password";
import { sendFromTemplate } from "@/lib/notifications";
import { audit, getRequestInfo } from "@/lib/audit";
import type { RoleName } from "@prisma/client";

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  roles: z.array(z.enum(["ADMIN", "INVENTARIO", "CLIENTE"])).min(1),
  clientId: z.string().optional().nullable(),
});

export async function GET() {
  const { error } = await requireRole("ADMIN");
  if (error) return error;
  return NextResponse.json(
    await prisma.user.findMany({
      include: { roles: { include: { role: true } }, client: true },
      orderBy: { createdAt: "desc" },
    }),
  );
}

export async function POST(req: Request) {
  const { error, user: admin } = await requireRole("ADMIN");
  if (error) return error;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { email, name, roles, clientId } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) return NextResponse.json({ error: "Email ya registrado" }, { status: 409 });

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);
  const roleRecords = await prisma.role.findMany({ where: { name: { in: roles as RoleName[] } } });

  const created = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      name,
      passwordHash,
      mustChangePassword: true,
      roles: { create: roleRecords.map((r) => ({ roleId: r.id })) },
    },
    include: { roles: { include: { role: true } } },
  });

  if (clientId && roles.includes("CLIENTE")) {
    await prisma.client.update({ where: { id: clientId }, data: { userId: created.id } });
  }

  const loginUrl = process.env.NEXTAUTH_URL ? `${process.env.NEXTAUTH_URL}/login` : "http://localhost:3000/login";
  try {
    await sendFromTemplate({
      templateCode: "NEW_USER_PASSWORD",
      recipient: created.email,
      vars: { name: created.name, email: created.email, password: tempPassword, loginUrl },
      channelOverride: "EMAIL",
      relatedType: "User",
      relatedId: created.id,
    });
  } catch (e) {
    console.error("No se pudo enviar email de credenciales:", e);
  }

  const { ip, userAgent } = getRequestInfo(req);
  // No guardar passwordHash en la bitácora
  const { passwordHash: _ph, ...safe } = created as any;
  await audit({ userId: admin?.id, action: "CREATE", entity: "User", entityId: created.id, after: { ...safe, roles: roles }, ipAddress: ip, userAgent });

  return NextResponse.json(
    {
      id: created.id,
      email: created.email,
      name: created.name,
      tempPasswordPreview: process.env.NODE_ENV !== "production" ? tempPassword : undefined,
    },
    { status: 201 },
  );
}
