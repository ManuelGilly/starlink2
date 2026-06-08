import { NextResponse } from "next/server";
import { runExpiringSubscriptionsDigest } from "@/jobs/expiring-subscriptions";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const auth = req.headers.get("authorization");
  const secret = url.searchParams.get("secret");
  const ok = auth === `Bearer ${process.env.CRON_SECRET}` || secret === process.env.CRON_SECRET;
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Ventana configurable (default 5 días).
  const daysParam = Number(url.searchParams.get("days"));
  const days = Number.isFinite(daysParam) && daysParam > 0 ? Math.min(daysParam, 31) : 5;

  try {
    const result = await runExpiringSubscriptionsDigest(days);
    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    console.error("[cron expiring-subscriptions] failed:", e);
    return NextResponse.json({ ok: false, error: e?.message ?? "error" }, { status: 500 });
  }
}
