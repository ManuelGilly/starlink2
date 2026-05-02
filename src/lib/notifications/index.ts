import type { NotificationChannelType } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { NotificationChannel, SendInput, SendResult } from "./types";
import { renderTemplate } from "./types";
import { emailChannel } from "./channels/email";
import { whatsappChannel } from "./channels/whatsapp";
import { telegramChannel } from "./channels/telegram";
import { smsChannel } from "./channels/sms";
import { instagramChannel } from "./channels/instagram";

const channels: Record<NotificationChannelType, NotificationChannel> = {
  EMAIL: emailChannel,
  WHATSAPP: whatsappChannel,
  TELEGRAM: telegramChannel,
  SMS: smsChannel,
  INSTAGRAM: instagramChannel,
};

export async function sendNotification(params: {
  channel: NotificationChannelType;
  recipient: string;
  subject?: string;
  body: string;
  templateId?: string;
  relatedType?: string;
  relatedId?: string;
}): Promise<SendResult & { logId: string }> {
  const ch = channels[params.channel];

  const dbChannel = await prisma.notificationChannel.findUnique({ where: { type: params.channel } });
  const enabled = dbChannel?.enabled ?? false;

  const log = await prisma.notificationLog.create({
    data: {
      channel: params.channel,
      recipient: params.recipient,
      subject: params.subject,
      body: params.body,
      templateId: params.templateId,
      relatedType: params.relatedType,
      relatedId: params.relatedId,
      status: "PENDIENTE",
    },
  });

  if (!enabled) {
    await prisma.notificationLog.update({
      where: { id: log.id },
      data: { status: "FALLIDO", error: "Canal deshabilitado" },
    });
    return { success: false, error: "Canal deshabilitado", logId: log.id };
  }

  const result = await ch.send({
    recipient: params.recipient,
    subject: params.subject,
    body: params.body,
  });

  await prisma.notificationLog.update({
    where: { id: log.id },
    data: {
      status: result.success ? "ENVIADO" : "FALLIDO",
      providerId: result.providerId,
      error: result.error,
      sentAt: result.success ? new Date() : null,
    },
  });

  return { ...result, logId: log.id };
}

export async function sendFromTemplate(params: {
  templateCode: string;
  recipient: string;
  vars: Record<string, string | number | null | undefined>;
  channelOverride?: NotificationChannelType;
  relatedType?: string;
  relatedId?: string;
}) {
  const tpl = await prisma.notificationTemplate.findUnique({
    where: { code: params.templateCode },
  });
  if (!tpl) throw new Error(`Plantilla no encontrada: ${params.templateCode}`);

  const channel = params.channelOverride ?? tpl.channelType ?? "EMAIL";
  const body = renderTemplate(tpl.body, params.vars);
  const subject = tpl.subject ? renderTemplate(tpl.subject, params.vars) : undefined;

  return sendNotification({
    channel,
    recipient: params.recipient,
    subject,
    body,
    templateId: tpl.id,
    relatedType: params.relatedType,
    relatedId: params.relatedId,
  });
}

export async function sendToAdmin(params: {
  templateCode: string;
  vars: Record<string, string | number | null | undefined>;
  relatedType?: string;
  relatedId?: string;
}) {
  const adminChat = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!adminChat) return null;
  return sendFromTemplate({
    templateCode: params.templateCode,
    recipient: adminChat,
    channelOverride: "TELEGRAM",
    vars: params.vars,
    relatedType: params.relatedType,
    relatedId: params.relatedId,
  });
}

export { channels };
