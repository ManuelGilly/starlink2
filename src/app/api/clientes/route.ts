import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ADMIN_OR_INV, requireRole } from "@/lib/rbac";
import { audit, getRequestInfo } from "@/lib/audit";

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  documentId: z.string().optional().nullable(),
  email: z.string().email(),
  phone: z.string().min(1),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  userId: z.string().optional().nullable(),
});

export async function GET() {
  const { error } = await requireRole(ADMIN_OR_INV);
  if (error) return error;
  return NextResponse.json(
    await prisma.client.findMany({
      include: { subscriptions: { include: { plan: true } } },
      orderBy: { lastName: "asc" },
    }),
  );
}

export async function POST(req: Request) {
  const { error, user } = await requireRole(ADMIN_OR_INV);
  if (error) return error;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const created = await prisma.client.create({ data: parsed.data });
  const { ip, userAgent } = getRequestInfo(req);
  await audit({ userId: user?.id, action: "CREATE", entity: "Client", entityId: created.id, after: created, ipAddress: ip, userAgent });
  return NextResponse.json(created, { status: 201 });
}
