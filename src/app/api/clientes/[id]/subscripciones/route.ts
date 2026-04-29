import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ADMIN_OR_INV, requireRole } from "@/lib/rbac";

const schema = z.object({
  planId: z.string().min(1),
  priceLocked: z.coerce.number().nonnegative().optional(),
  billingDay: z.coerce.number().int().min(1).max(28).default(1),
  startDate: z.string().datetime().optional(),
  notes: z.string().nullable().optional(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireRole(ADMIN_OR_INV);
  if (error) return error;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const plan = await prisma.plan.findUnique({ where: { id: parsed.data.planId } });
  if (!plan) return NextResponse.json({ error: "Plan no existe" }, { status: 400 });

  const sub = await prisma.subscription.create({
    data: {
      clientId: params.id,
      planId: plan.id,
      priceLocked: parsed.data.priceLocked ?? plan.price,
      billingDay: parsed.data.billingDay,
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : new Date(),
      notes: parsed.data.notes ?? undefined,
    },
  });
  return NextResponse.json(sub, { status: 201 });
}
