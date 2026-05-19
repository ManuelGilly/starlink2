import { Resend } from "resend";
import nodemailer from "nodemailer";
import type { NotificationChannel, SendInput, SendResult } from "../types";

// Usa Resend si hay RESEND_API_KEY, sino cae a nodemailer SMTP
async function sendViaResend(input: SendInput): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY!;
  const from = process.env.RESEND_FROM || "Starlink VE <noreply@starlink.ve>";
  const resend = new Resend(apiKey);
  try {
    const { data, error } = await resend.emails.send({
      from,
      to: [input.recipient],
      subject: input.subject ?? "(sin asunto)",
      text: input.body,
      html: input.body.replace(/\n/g, "<br/>"),
    });
    if (error) return { success: false, error: error.message };
    return { success: true, providerId: data?.id };
  } catch (e: any) {
    return { success: false, error: e?.message ?? "error envío email" };
  }
}

let _transporter: nodemailer.Transporter | null = null;
function getSmtpTransporter(): nodemailer.Transporter | null {
  if (_transporter) return _transporter;
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!host || !user || !pass) return null;
  _transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });
  return _transporter;
}

export const emailChannel: NotificationChannel = {
  type: "EMAIL",
  isConfigured() {
    return Boolean(process.env.RESEND_API_KEY) ||
      Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
  },
  async send(input: SendInput): Promise<SendResult> {
    if (process.env.RESEND_API_KEY) return sendViaResend(input);

    const t = getSmtpTransporter();
    if (!t) {
      console.log(`[EMAIL stub] to=${input.recipient} subject=${input.subject}\n${input.body}`);
      return { success: false, error: "No hay proveedor de email configurado (RESEND_API_KEY o SMTP_HOST)" };
    }
    try {
      const info = await t.sendMail({
        from: process.env.SMTP_FROM || "no-reply@starlink.ve",
        to: input.recipient,
        subject: input.subject ?? "(sin asunto)",
        text: input.body,
        html: input.body.replace(/\n/g, "<br/>"),
      });
      return { success: true, providerId: info.messageId };
    } catch (e: any) {
      return { success: false, error: e?.message ?? "error envío email" };
    }
  },
};
