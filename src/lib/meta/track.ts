import type { CapiCustomData, CapiEventName } from "./capi";

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : undefined;
}

function generateEventId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export interface TrackOptions {
  customData?: CapiCustomData;
  email?: string;
  phone?: string;
}

/**
 * Dispara el evento en el Pixel del navegador y en paralelo lo manda a CAPI
 * server-side con el mismo eventId para que Meta deduplique.
 */
export function trackEvent(eventName: CapiEventName, opts: TrackOptions = {}): void {
  if (typeof window === "undefined") return;

  const eventId = generateEventId();
  const customData = opts.customData ?? {};

  if (window.fbq) {
    window.fbq("track", eventName, customData, { eventID: eventId });
  }

  const payload = {
    eventName,
    eventId,
    eventSourceUrl: window.location.href,
    email: opts.email,
    phone: opts.phone,
    fbp: readCookie("_fbp"),
    fbc: readCookie("_fbc"),
    customData,
  };

  fetch("/api/meta/conversion", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    // tracking no debe romper la UX; ignoramos errores de red
  });
}
