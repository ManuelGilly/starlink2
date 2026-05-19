import type { NotificationChannel, SendInput, SendResult } from "../types";

// UltraMsg: instancia WhatsApp más simple, sin verificación de negocio Meta
// Docs: https://ultramsg.com/api
async function sendViaUltraMsg(input: SendInput): Promise<SendResult> {
  const instance = process.env.ULTRAMSG_INSTANCE_ID!;
  const token = process.env.ULTRAMSG_TOKEN!;
  const url = `https://api.ultramsg.com/${instance}/messages/chat`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        token,
        to: input.recipient.replace(/\s/g, ""),
        body: input.body,
      }).toString(),
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      return { success: false, error: data?.error ?? `HTTP ${res.status}` };
    }
    return { success: true, providerId: data?.id ?? "ultramsg" };
  } catch (e: any) {
    return { success: false, error: e?.message ?? "error UltraMsg" };
  }
}

// Meta Cloud API (oficial)
async function sendViaMeta(input: SendInput): Promise<SendResult> {
  const phoneId = process.env.WHATSAPP_PHONE_ID!;
  const token = process.env.WHATSAPP_ACCESS_TOKEN!;
  const version = process.env.WHATSAPP_API_VERSION || "v20.0";
  const url = `https://graph.facebook.com/${version}/${phoneId}/messages`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: input.recipient.replace(/\D/g, ""),
        type: "text",
        text: { body: input.body },
      }),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data?.error?.message ?? `HTTP ${res.status}` };
    return { success: true, providerId: data?.messages?.[0]?.id };
  } catch (e: any) {
    return { success: false, error: e?.message ?? "error Meta WhatsApp" };
  }
}

export const whatsappChannel: NotificationChannel = {
  type: "WHATSAPP",
  isConfigured() {
    return (
      Boolean(process.env.ULTRAMSG_INSTANCE_ID && process.env.ULTRAMSG_TOKEN) ||
      Boolean(process.env.WHATSAPP_PHONE_ID && process.env.WHATSAPP_ACCESS_TOKEN)
    );
  },
  async send(input: SendInput): Promise<SendResult> {
    // Preferir UltraMsg si está configurado (más fácil de activar)
    if (process.env.ULTRAMSG_INSTANCE_ID && process.env.ULTRAMSG_TOKEN) {
      return sendViaUltraMsg(input);
    }
    if (process.env.WHATSAPP_PHONE_ID && process.env.WHATSAPP_ACCESS_TOKEN) {
      return sendViaMeta(input);
    }
    console.log(`[WHATSAPP stub] to=${input.recipient}\n${input.body}`);
    return { success: false, error: "WhatsApp no configurado (ULTRAMSG_INSTANCE_ID/TOKEN o WHATSAPP_PHONE_ID/ACCESS_TOKEN)" };
  },
};
