import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendFromTemplate } from "@/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  if (!process.env.ADMIN_SEED_SECRET || auth !== `Bearer ${process.env.ADMIN_SEED_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const env = {
    hasTelegramToken: Boolean(process.env.TELEGRAM_BOT_TOKEN),
    telegramTokenLen: process.env.TELEGRAM_BOT_TOKEN?.length ?? 0,
    hasAdminChatId: Boolean(process.env.TELEGRAM_ADMIN_CHAT_ID),
    adminChatId: process.env.TELEGRAM_ADMIN_CHAT_ID ?? null,
    nodeEnv: process.env.NODE_ENV,
  };

  let body: any;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const recipient = String(body.recipient ?? process.env.TELEGRAM_ADMIN_CHAT_ID ?? "");

  const channels = await prisma.notificationChannel.findMany({});
  const templates = await prisma.notificationTemplate.findMany({ select: { code: true, channelType: true } });

  if (!recipient) {
    return NextResponse.json({ ok: false, reason: "no recipient", env, channels, templates });
  }

  let sendResult: any = null;
  let sendError: any = null;
  try {
    sendResult = await sendFromTemplate({
      templateCode: "WELCOME_CLIENT",
      recipient,
      channelOverride: "TELEGRAM",
      vars: { firstName: "Test" },
    });
  } catch (e: any) {
    sendError = { message: e?.message, stack: e?.stack };
  }

  return NextResponse.json({
    ok: !sendError && sendResult?.success,
    env,
    channels,
    templatesCount: templates.length,
    welcomeTemplateExists: templates.some((t) => t.code === "WELCOME_CLIENT"),
    sendResult,
    sendError,
  });
}
