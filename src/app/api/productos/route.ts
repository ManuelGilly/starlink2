import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ADMIN_OR_INV, getCurrentUser, requireRole } from "@/lib/rbac";
import { audit, getRequestInfo } from "@/lib/audit";

const schema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  features: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  costPrice: z.coerce.number().nonnegative(),
  salePrice: z.coerce.number().nonnegative(),
  minStock: z.coerce.number().int().nonnegative().default(0),
  warrantyDays: z.coerce.number().int().nonnegative().default(0),
  active: z.boolean().optional(),
});

export async function GET() {
  const { error } = await requireRole(ADMIN_OR_INV);
  if (error) return error;
  return NextResponse.json(
    await prisma.product.findMany({ include: { category: true }, orderBy: { name: "asc" } }),
  );
}

export async function POST(req: Request) {
  const { error, user } = await requireRole(ADMIN_OR_INV);
  if (error) return error;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const created = await prisma.product.create({ data: parsed.data });
  const { ip, userAgent } = getRequestInfo(req);
  await audit({ userId: user?.id, action: "CREATE", entity: "Product", entityId: created.id, after: created, ipAddress: ip, userAgent });
  return NextResponse.json(created, { status: 201 });
}
