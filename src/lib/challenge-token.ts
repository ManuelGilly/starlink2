import { createHmac, timingSafeEqual } from "crypto";

type Purpose = "2fa" | "telegram-setup";
type Payload = { userId: string; purpose: Purpose; exp: number };

function getSecret(): string {
  const s = process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("NEXTAUTH_SECRET no configurado");
  return s;
}

function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(s: string): Buffer {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

function sign(data: string): string {
  return b64url(createHmac("sha256", getSecret()).update(data).digest());
}

export function createChallengeToken(userId: string, purpose: Purpose, ttlSeconds = 600): string {
  const payload: Payload = { userId, purpose, exp: Math.floor(Date.now() / 1000) + ttlSeconds };
  const body = b64url(Buffer.from(JSON.stringify(payload)));
  const sig = sign(body);
  return `${body}.${sig}`;
}

export function verifyChallengeToken(token: string, expectedPurpose: Purpose): { userId: string } | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const expected = sign(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  let payload: Payload;
  try {
    payload = JSON.parse(fromB64url(body).toString("utf8"));
  } catch {
    return null;
  }
  if (payload.purpose !== expectedPurpose) return null;
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;
  return { userId: payload.userId };
}
