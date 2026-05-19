import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ADMIN_OR_INV, requireRole } from "@/lib/rbac";

const schema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().nullable().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().nullable().optional(),
  budget: z.coerce.number().nonnegative(),
  messagesReceived: z.coerce.number().int().nonnegative().default(0),
  status: z.enum(["BORRADOR", "ACTIVA", "PAUSADA", "FINALIZADA"]).default("ACTIVA"),
  platform: z.string().default("Instagram"),
  adUrl: z.string().url().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function GET(req: Request) {
  const { error } = await requireRole(ADMIN_OR_INV);
  if (error) return error;

  const url = new URL(req.url);
  const status = url.searchParams.get("status");

  const campaigns = await prisma.adCampaign.findMany({
    where: status ? { status: status as any } : undefined,
    include: {
      _count: { select: { sales: true, subscriptions: true } },
    },
    orderBy: { startDate: "desc" },
  });

  return NextResponse.json(campaigns);
}

export async function POST(req: Request) {
  const { error } = await requireRole(["ADMIN"]);
  if (error) return error;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { name, description, startDate, endDate, budget, messagesReceived, status, platform, adUrl, notes } = parsed.data;

  const campaign = await prisma.adCampaign.create({
    data: {
      name,
      description: description ?? undefined,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      budget,
      messagesReceived,
      status,
      platform,
      adUrl: adUrl ?? undefined,
      notes: notes ?? undefined,
    },
  });

  return NextResponse.json(campaign, { status: 201 });
}
