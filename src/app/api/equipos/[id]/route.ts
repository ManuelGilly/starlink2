import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ADMIN_OR_INV, requireRole } from "@/lib/rbac";

const patchSchema = z.object({
  serialNumber: z.string().nullable().optional(),
  model: z.string().min(1).optional(),
  condition: z.enum(["NUEVO", "USADO", "DANADO", "DADO_DE_BAJA"]).optional(),
  clientId: z.string().nullable().optional(),
  purchaseDate: z.string().datetime().nullable().optional(),
  purchasePrice: z.coerce.number().nonnegative().nullable().optional(),
  notes: z.string().nullable().optional(),
  active: z.boolean().optional(),
});

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireRole(ADMIN_OR_INV);
  if (error) return error;

  const eq = await prisma.equipment.findUnique({
    where: { id: params.id },
    include: { client: { select: { id: true, firstName: true, lastName: true } } },
  });

  if (!eq) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(eq);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireRole(ADMIN_OR_INV);
  if (error) return error;

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;
  const eq = await prisma.equipment.update({
    where: { id: params.id },
    data: {
      ...(data.serialNumber !== undefined && { serialNumber: data.serialNumber }),
      ...(data.model !== undefined && { model: data.model }),
      ...(data.condition !== undefined && { condition: data.condition }),
      ...(data.clientId !== undefined && { clientId: data.clientId }),
      ...(data.purchaseDate !== undefined && { purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null }),
      ...(data.purchasePrice !== undefined && { purchasePrice: data.purchasePrice }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.active !== undefined && { active: data.active }),
    },
  });

  return NextResponse.json(eq);
}
