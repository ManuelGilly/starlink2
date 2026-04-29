import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ADMIN_OR_INV, requireRole } from "@/lib/rbac";
import { audit, getRequestInfo } from "@/lib/audit";

const schema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  details: z.string().optional().nullable(),
  price: z.coerce.number().nonnegative(),
  cost: z.coerce.number().nonnegative().optional().nullable(),
  billingCycle: z.enum(["MONTHLY", "YEARLY", "ONE_TIME"]).default("MONTHLY"),
  active: z.boolean().optional(),
});

export async function GET() {
  const { error } = await requireRole(ADMIN_OR_INV);
  if (error) return error;
  return NextResponse.json(await prisma.plan.findMany({ orderBy: { name: "asc" } }));
}

export async function POST(req: Request) {
  const { error, user } = await requireRole(ADMIN_OR_INV);
  if (error) return error;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const created = await prisma.plan.create({ data: parsed.data });
  const { ip, userAgent } = getRequestInfo(req);
  await audit({ userId: user?.id, action: "CREATE", entity: "Plan", entityId: created.id, after: created, ipAddress: ip, userAgent });
  return NextResponse.json(created, { status: 201 });
}
