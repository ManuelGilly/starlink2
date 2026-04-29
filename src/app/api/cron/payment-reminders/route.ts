import { NextResponse } from "next/server";
import { runPaymentReminders } from "@/jobs/payment-reminders";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await runPaymentReminders();
    return NextResponse.json({ ok: true, result });
  } catch (e: any) {
    console.error("[cron reminders] failed:", e);
    return NextResponse.json({ ok: false, error: e?.message ?? "error" }, { status: 500 });
  }
}
