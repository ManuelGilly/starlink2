import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ADMIN_OR_INV, requireRole } from "@/lib/rbac";
import { audit, getRequestInfo } from "@/lib/audit";

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
  const { error, user } = await requireRole(ADMIN_OR_INV);
  if (error) return error;

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const before = await prisma.equipment.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const data = parsed.data;
  try {
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

    const { ip, userAgent } = getRequestInfo(req);
    await audit({ userId: user?.id, action: "UPDATE", entity: "Equipment", entityId: eq.id, before, after: eq, ipAddress: ip, userAgent });
    return NextResponse.json(eq);
  } catch (e: any) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "Ya existe un equipo con ese número de serie." }, { status: 409 });
    }
    throw e;
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { error, user } = await requireRole("ADMIN");
  if (error) return error;

  const before = await prisma.equipment.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  // Un equipo ya vendido está vinculado a una venta (COGS / ganancia): no se borra.
  if (before.saleItemId) {
    return NextResponse.json(
      { error: "El equipo está asociado a una venta. Anula la venta antes de borrarlo." },
      { status: 409 },
    );
  }

  try {
    await prisma.equipment.delete({ where: { id: params.id } });
  } catch (e: any) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return NextResponse.json(
        { error: "El equipo tiene registros asociados. Márcalo como inactivo en lugar de borrarlo." },
        { status: 409 },
      );
    }
    throw e;
  }

  const { ip, userAgent } = getRequestInfo(req);
  await audit({ userId: user?.id, action: "DELETE", entity: "Equipment", entityId: before.id, before, ipAddress: ip, userAgent });
  return NextResponse.json({ ok: true });
}
