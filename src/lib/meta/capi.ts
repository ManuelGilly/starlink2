import { createHash } from "crypto";

const GRAPH_API_VERSION = "v20.0";

export type CapiEventName = "PageView" | "ViewContent" | "Lead" | "Contact" | "InitiateCheckout";

export interface CapiUserData {
  email?: string;
  phone?: string;
  clientIp?: string;
  userAgent?: string;
  fbp?: string;
  fbc?: string;
  externalId?: string;
}

export interface CapiCustomData {
  currency?: string;
  value?: number;
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  [key: string]: unknown;
}

export interface CapiEvent {
  eventName: CapiEventName;
  eventId: string;
  eventSourceUrl?: string;
  userData: CapiUserData;
  customData?: CapiCustomData;
  actionSource?: "website" | "chat" | "email";
}

function sha256(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export async function sendCapiEvent(event: CapiEvent): Promise<{ ok: boolean; error?: string }> {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;
  const testEventCode = process.env.META_CAPI_TEST_EVENT_CODE;

  if (!pixelId || !accessToken) {
    return { ok: false, error: "Meta Pixel ID or CAPI access token not configured" };
  }

  const userData: Record<string, string | string[]> = {};
  if (event.userData.email) userData.em = sha256(event.userData.email);
  if (event.userData.phone) userData.ph = sha256(normalizePhone(event.userData.phone));
  if (event.userData.externalId) userData.external_id = sha256(event.userData.externalId);
  if (event.userData.clientIp) userData.client_ip_address = event.userData.clientIp;
  if (event.userData.userAgent) userData.client_user_agent = event.userData.userAgent;
  if (event.userData.fbp) userData.fbp = event.userData.fbp;
  if (event.userData.fbc) userData.fbc = event.userData.fbc;

  const payload = {
    data: [
      {
        event_name: event.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: event.eventId,
        event_source_url: event.eventSourceUrl,
        action_source: event.actionSource ?? "website",
        user_data: userData,
        custom_data: event.customData ?? {},
      },
    ],
    ...(testEventCode ? { test_event_code: testEventCode } : {}),
  };

  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${pixelId}/events?access_token=${accessToken}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `Meta CAPI ${res.status}: ${text}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "unknown error" };
  }
}
