import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { notificationTemplates } from "@/lib/notifications/seed-templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  if (!process.env.ADMIN_SEED_SECRET || auth !== `Bearer ${process.env.ADMIN_SEED_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const upserted: string[] = [];
    for (const t of notificationTemplates) {
      const r = await prisma.notificationTemplate.upsert({
        where: { code: t.code },
        update: { name: t.name, subject: t.subject, body: t.body, channelType: t.channelType },
        create: t,
      });
      upserted.push(r.code);
    }
    return NextResponse.json({ ok: true, count: upserted.length, codes: upserted });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "error" }, { status: 500 });
  }
}
