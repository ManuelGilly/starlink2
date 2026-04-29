import type { NotificationChannel, SendInput, SendResult } from "../types";

export const smsChannel: NotificationChannel = {
  type: "SMS",
  isConfigured() {
    return Boolean(
      process.env.TWILIO_ACCOUNT_SID &&
        process.env.TWILIO_AUTH_TOKEN &&
        process.env.TWILIO_FROM_NUMBER,
    );
  },
  async send(input: SendInput): Promise<SendResult> {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_FROM_NUMBER;

    if (!sid || !token || !from) {
      console.log(`[SMS stub] to=${input.recipient}\n${input.body}`);
      return { success: true, providerId: "stub" };
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
    const auth = Buffer.from(`${sid}:${token}`).toString("base64");
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ From: from, To: input.recipient, Body: input.body }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data?.message ?? `HTTP ${res.status}` };
      return { success: true, providerId: data.sid };
    } catch (e: any) {
      return { success: false, error: e?.message ?? "error envío sms" };
    }
  },
};
