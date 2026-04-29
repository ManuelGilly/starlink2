import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";

const schema = z.object({
  type: z.enum(["WHATSAPP", "TELEGRAM", "INSTAGRAM", "EMAIL", "SMS"]),
  enabled: z.boolean(),
});

export async function GET() {
  const { error } = await requireRole("ADMIN");
  if (error) return error;
  return NextResponse.json(await prisma.notificationChannel.findMany({ orderBy: { type: "asc" } }));
}

export async function PATCH(req: Request) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const updated = await prisma.notificationChannel.update({
    where: { type: parsed.data.type },
    data: { enabled: parsed.data.enabled },
  });
  return NextResponse.json(updated);
}
