import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";

export const runtime = "nodejs";

const ALLOWED_KEYS = new Set(["BINANCE_PARALELO_VES_USD"]);

const schema = z.object({ value: z.string().max(200) });

export async function PATCH(req: Request, { params }: { params: { key: string } }) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  if (!ALLOWED_KEYS.has(params.key)) {
    return NextResponse.json({ error: "Setting no permitido" }, { status: 400 });
  }
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await prisma.appSetting.upsert({
    where: { key: params.key },
    update: { value: parsed.data.value },
    create: { key: params.key, value: parsed.data.value },
  });

  return NextResponse.json({ ok: true });
}
