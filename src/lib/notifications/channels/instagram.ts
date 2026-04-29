import type { NotificationChannel, SendInput, SendResult } from "../types";

export const instagramChannel: NotificationChannel = {
  type: "INSTAGRAM",
  isConfigured() {
    return Boolean(process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_ACCOUNT_ID);
  },
  async send(input: SendInput): Promise<SendResult> {
    const token = process.env.INSTAGRAM_ACCESS_TOKEN;
    const account = process.env.INSTAGRAM_ACCOUNT_ID;
    if (!token || !account) {
      console.log(`[INSTAGRAM stub] to=${input.recipient}\n${input.body}`);
      return { success: true, providerId: "stub" };
    }
    try {
      const res = await fetch(`https://graph.facebook.com/v20.0/${account}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipient: { id: input.recipient },
          message: { text: input.body },
        }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data?.error?.message ?? `HTTP ${res.status}` };
      return { success: true, providerId: data.message_id };
    } catch (e: any) {
      return { success: false, error: e?.message ?? "error envío instagram" };
    }
  },
};
