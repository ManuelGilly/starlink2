import type { NotificationChannel, SendInput, SendResult } from "../types";

export const whatsappChannel: NotificationChannel = {
  type: "WHATSAPP",
  isConfigured() {
    return Boolean(process.env.WHATSAPP_PHONE_ID && process.env.WHATSAPP_ACCESS_TOKEN);
  },
  async send(input: SendInput): Promise<SendResult> {
    const phoneId = process.env.WHATSAPP_PHONE_ID;
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const version = process.env.WHATSAPP_API_VERSION || "v20.0";

    if (!phoneId || !token) {
      console.log(`[WHATSAPP stub] to=${input.recipient}\n${input.body}`);
      return { success: true, providerId: "stub" };
    }

    const url = `https://graph.facebook.com/${version}/${phoneId}/messages`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: input.recipient.replace(/\D/g, ""),
          type: "text",
          text: { body: input.body },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data?.error?.message ?? `HTTP ${res.status}` };
      }
      return { success: true, providerId: data?.messages?.[0]?.id };
    } catch (e: any) {
      return { success: false, error: e?.message ?? "error envío whatsapp" };
    }
  },
};
