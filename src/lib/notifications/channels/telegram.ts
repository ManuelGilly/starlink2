import type { NotificationChannel, SendInput, SendResult } from "../types";

export const telegramChannel: NotificationChannel = {
  type: "TELEGRAM",
  isConfigured() {
    return Boolean(process.env.TELEGRAM_BOT_TOKEN);
  },
  async send(input: SendInput): Promise<SendResult> {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.log(`[TELEGRAM stub] chat=${input.recipient}\n${input.body}`);
      return { success: true, providerId: "stub" };
    }
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: input.recipient,
          text: input.body,
          parse_mode: "HTML",
        }),
      });
      const data = await res.json();
      if (!data.ok) return { success: false, error: data.description ?? `HTTP ${res.status}` };
      return { success: true, providerId: String(data.result?.message_id ?? "") };
    } catch (e: any) {
      return { success: false, error: e?.message ?? "error envío telegram" };
    }
  },
};
