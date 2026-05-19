import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ADMIN_OR_INV, requireRole } from "@/lib/rbac";

const patchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().nullable().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().nullable().optional(),
  budget: z.coerce.number().nonnegative().optional(),
  messagesReceived: z.coerce.number().int().nonnegative().optional(),
  status: z.enum(["BORRADOR", "ACTIVA", "PAUSADA", "FINALIZADA"]).optional(),
  platform: z.string().optional(),
  adUrl: z.string().url().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireRole(ADMIN_OR_INV);
  if (error) return error;

  const campaign = await prisma.adCampaign.findUnique({
    where: { id: params.id },
    include: {
      sales: {
        include: {
          client: true,
          items: { include: { product: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      subscriptions: {
        include: {
          client: true,
          plan: true,
          payments: { where: { status: "CONFIRMADO" }, orderBy: { createdAt: "desc" } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!campaign) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  return NextResponse.json(campaign);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireRole(["ADMIN"]);
  if (error) return error;

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;
  const campaign = await prisma.adCampaign.update({
    where: { id: params.id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.startDate !== undefined && { startDate: new Date(data.startDate) }),
      ...(data.endDate !== undefined && { endDate: data.endDate ? new Date(data.endDate) : null }),
      ...(data.budget !== undefined && { budget: data.budget }),
      ...(data.messagesReceived !== undefined && { messagesReceived: data.messagesReceived }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.platform !== undefined && { platform: data.platform }),
      ...(data.adUrl !== undefined && { adUrl: data.adUrl }),
      ...(data.notes !== undefined && { notes: data.notes }),
    },
  });

  return NextResponse.json(campaign);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireRole(["ADMIN"]);
  if (error) return error;

  await prisma.adCampaign.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
