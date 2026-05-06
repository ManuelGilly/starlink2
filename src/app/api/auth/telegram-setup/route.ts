import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyChallengeToken, createChallengeToken } from "@/lib/challenge-token";
import { createAndSendCode } from "@/lib/two-factor";
import { telegramChannel } from "@/lib/notifications/channels/telegram";

const schema = z.object({
  challengeToken: z.string().min(1),
  telegramChatId: z.string().min(1).regex(/^-?\d+$/, "El chat ID debe ser numérico"),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const decoded = verifyChallengeToken(parsed.data.challengeToken, "telegram-setup");
  if (!decoded) return NextResponse.json({ error: "Sesión expirada. Inicia el login de nuevo." }, { status: 401 });

  const inUse = await prisma.user.findUnique({ where: { telegramChatId: parsed.data.telegramChatId } });
  if (inUse && inUse.id !== decoded.userId) {
    return NextResponse.json({ error: "Ese chat ya está vinculado a otro usuario" }, { status: 409 });
  }

  const probe = await telegramChannel.send({
    recipient: parsed.data.telegramChatId,
    body: "✅ Tu cuenta admin de Starlink Venezuela quedó vinculada a este chat. A partir de ahora vas a recibir aquí los códigos de acceso.",
  });
  if (!probe.success) {
    return NextResponse.json(
      { error: `No se pudo enviar al chat: ${probe.error ?? "error desconocido"}. Asegúrate de haberle escrito antes al bot.` },
      { status: 400 },
    );
  }

  await prisma.user.update({
    where: { id: decoded.userId },
    data: { telegramChatId: parsed.data.telegramChatId },
  });

  try {
    await createAndSendCode(decoded.userId, parsed.data.telegramChatId);
  } catch (e) {
    console.error("[2fa] no se pudo enviar el código tras setup:", e);
    return NextResponse.json({ error: "Vinculado, pero no se pudo enviar el código. Intenta el login de nuevo." }, { status: 502 });
  }

  return NextResponse.json({ challengeToken: createChallengeToken(decoded.userId, "2fa") });
}
