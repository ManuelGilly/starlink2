import nodemailer from "nodemailer";
import type { NotificationChannel, SendInput, SendResult } from "../types";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!host || !user || !pass) return null;
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });
  return transporter;
}

export const emailChannel: NotificationChannel = {
  type: "EMAIL",
  isConfigured() {
    return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
  },
  async send(input: SendInput): Promise<SendResult> {
    const t = getTransporter();
    if (!t) {
      console.log(`[EMAIL stub] to=${input.recipient} subject=${input.subject}\n${input.body}`);
      return { success: true, providerId: "stub" };
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
