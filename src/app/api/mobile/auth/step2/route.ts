import { NextResponse } from "next/server";
import { z } from "zod";
import { sign } from "jsonwebtoken";
import { prisma } from "@/lib/db";
import { verifyChallengeToken } from "@/lib/challenge-token";
import { consumeCode } from "@/lib/two-factor";

const schema = z.object({
  challengeToken: z.string().min(1),
  code: z.string().length(6).optional(), // opcional para rol INVENTARIO (sin 2FA)
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return NextResponse.json({ error: "Configuración inválida" }, { status: 500 });

  const { challengeToken, code } = parsed.data;

  // Verificar challenge token (acepta propósito "2fa" o "telegram-setup" para skip-2fa)
  const result2fa = verifyChallengeToken(challengeToken, "2fa");
  const resultSkip = verifyChallengeToken(challengeToken, "telegram-setup");

  const verified = result2fa ?? resultSkip;
  if (!verified) {
    return NextResponse.json({ error: "Token inválido o expirado" }, { status: 401 });
  }

  const { userId } = verified;

  // Si el token era para 2FA, verificar el código
  if (result2fa) {
    if (!code) return NextResponse.json({ error: "Código requerido" }, { status: 400 });
    const valid = await consumeCode(userId, code);
    if (!valid) return NextResponse.json({ error: "Código inválido o expirado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { roles: { include: { role: true } } },
  });
  if (!user || !user.active) {
    return NextResponse.json({ error: "Usuario no disponible" }, { status: 401 });
  }

  const roles = user.roles.map((r) => r.role.name);

  await prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  });

  const token = sign(
    { userId: user.id, email: user.email, name: user.name, roles },
    secret,
    { expiresIn: "30d" },
  );

  return NextResponse.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, roles },
  });
}
