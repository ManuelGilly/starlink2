import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { createChallengeToken } from "@/lib/challenge-token";
import { createAndSendCode } from "@/lib/two-factor";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 8;
const attempts = new Map<string, number[]>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const arr = (attempts.get(key) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  arr.push(now);
  attempts.set(key, arr);
  return arr.length > RATE_MAX;
}

const GENERIC_ERROR = "Credenciales inválidas";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });

  const key = `${ip}:${parsed.data.email.toLowerCase()}`;
  if (rateLimited(key)) {
    return NextResponse.json({ error: "Demasiados intentos. Espera un momento." }, { status: 429 });
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase().trim() },
    include: { roles: { include: { role: true } } },
  });
  if (!user || !user.active) return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });

  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });

  const isAdmin = user.roles.some((r) => r.role.name === "ADMIN");
  const isInventario = user.roles.some((r) => r.role.name === "INVENTARIO");
  if (!isAdmin && !isInventario) {
    return NextResponse.json({ error: "Sin acceso al panel de administración" }, { status: 403 });
  }

  // Inventario sin 2FA requerido — retorna challengeToken con propósito no-2fa
  if (!isAdmin) {
    const challengeToken = createChallengeToken(user.id, "telegram-setup"); // reutilizamos para skip-2fa
    return NextResponse.json({ requires2fa: false, challengeToken, userId: user.id });
  }

  if (!user.telegramChatId) {
    const challengeToken = createChallengeToken(user.id, "telegram-setup");
    return NextResponse.json({ needsTelegramSetup: true, challengeToken });
  }

  try {
    await createAndSendCode(user.id, user.telegramChatId);
  } catch (e) {
    console.error("[2fa mobile] no se pudo enviar el código:", e);
    return NextResponse.json(
      { error: "No se pudo enviar el código. Intenta de nuevo." },
      { status: 502 },
    );
  }

  const challengeToken = createChallengeToken(user.id, "2fa");
  return NextResponse.json({ requires2fa: true, challengeToken });
}
