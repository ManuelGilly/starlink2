import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ADMIN_OR_INV, getCurrentUser, requireRole } from "@/lib/rbac";
import { audit, getRequestInfo } from "@/lib/audit";

const schema = z.object({
  productId: z.string().min(1),
  type: z.enum(["ENTRADA", "SALIDA", "AJUSTE", "MERMA", "DEVOLUCION"]),
  quantity: z.coerce.number().int(),
  unitCost: z.coerce.number().nonnegative().optional().nullable(),
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  occurredAt: z.string().datetime().optional(),
});

export async function GET(req: Request) {
  const { error } = await requireRole(ADMIN_OR_INV);
  if (error) return error;
  const url = new URL(req.url);
  const productId = url.searchParams.get("productId");
  return NextResponse.json(
    await prisma.inventoryMovement.findMany({
      where: productId ? { productId } : undefined,
      include: { product: true },
      orderBy: { occurredAt: "desc" },
      take: 200,
    }),
  );
}

export async function POST(req: Request) {
  const { error } = await requireRole(ADMIN_OR_INV);
  if (error) return error;
  const user = await getCurrentUser();

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  if (parsed.data.type !== "AJUSTE" && parsed.data.quantity <= 0) {
    return NextResponse.json({ error: "Cantidad debe ser > 0" }, { status: 400 });
  }

  const mov = await prisma.inventoryMovement.create({
    data: {
      ...parsed.data,
      occurredAt: parsed.data.occurredAt ? new Date(parsed.data.occurredAt) : new Date(),
    },
  });

  const { ip, userAgent } = getRequestInfo(req);
  await audit({ userId: user?.id, action: "CREATE", entity: "InventoryMovement", entityId: mov.id, after: mov, ipAddress: ip, userAgent });

  return NextResponse.json(mov, { status: 201 });
}
