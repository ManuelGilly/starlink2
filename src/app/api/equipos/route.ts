import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ADMIN_OR_INV, requireRole } from "@/lib/rbac";

const schema = z.object({
  serialNumber: z.string().min(1).nullable().optional(),
  model: z.string().min(1),
  condition: z.enum(["NUEVO", "USADO", "DANADO", "DADO_DE_BAJA"]).default("NUEVO"),
  clientId: z.string().nullable().optional(),
  purchaseDate: z.string().datetime().nullable().optional(),
  purchasePrice: z.coerce.number().nonnegative().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function GET(req: Request) {
  const { error } = await requireRole(ADMIN_OR_INV);
  if (error) return error;

  const url = new URL(req.url);
  const clientId = url.searchParams.get("clientId");
  const unassigned = url.searchParams.get("unassigned") === "true";
  const productId = url.searchParams.get("productId");
  const available = url.searchParams.get("available") === "true";

  const equipment = await prisma.equipment.findMany({
    where: {
      ...(clientId ? { clientId } : {}),
      ...(unassigned ? { clientId: null } : {}),
      ...(productId ? { productId } : {}),
      ...(available ? { availability: "DISPONIBLE" } : {}),
      active: true,
    },
    include: { client: { select: { id: true, firstName: true, lastName: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(equipment);
}

export async function POST(req: Request) {
  const { error } = await requireRole(ADMIN_OR_INV);
  if (error) return error;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;
  const equipment = await prisma.equipment.create({
    data: {
      serialNumber: data.serialNumber ?? undefined,
      model: data.model,
      condition: data.condition,
      clientId: data.clientId ?? undefined,
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
      purchasePrice: data.purchasePrice ?? undefined,
      notes: data.notes ?? undefined,
    },
  });

  return NextResponse.json(equipment, { status: 201 });
}
