import type { NotificationChannelType } from "@prisma/client";

export interface SendInput {
  recipient: string; // email, phone, username, chatId
  subject?: string;
  body: string;
  meta?: Record<string, any>;
}

export interface SendResult {
  success: boolean;
  providerId?: string;
  error?: string;
}

export interface NotificationChannel {
  readonly type: NotificationChannelType;
  isConfigured(): boolean;
  send(input: SendInput): Promise<SendResult>;
}

export function renderTemplate(body: string, vars: Record<string, string | number | null | undefined>): string {
  return body.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
    const v = vars[key];
    return v === undefined || v === null ? "" : String(v);
  });
}
