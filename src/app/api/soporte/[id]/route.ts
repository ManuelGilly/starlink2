import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ADMIN_OR_INV, requireRole } from "@/lib/rbac";

const patchSchema = z.object({
  status: z.enum(["ABIERTO", "EN_PROCESO", "RESUELTO", "CERRADO"]).optional(),
  priority: z.enum(["BAJA", "MEDIA", "ALTA", "URGENTE"]).optional(),
  type: z.enum(["TECNICO", "FACTURACION", "CONSULTA", "OTRO"]).optional(),
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  resolution: z.string().nullable().optional(),
  assignedTo: z.string().nullable().optional(),
});

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireRole(ADMIN_OR_INV);
  if (error) return error;

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: params.id },
    include: { client: { select: { id: true, firstName: true, lastName: true } } },
  });

  if (!ticket) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(ticket);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireRole(ADMIN_OR_INV);
  if (error) return error;

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;
  const isResolving = data.status === "RESUELTO" || data.status === "CERRADO";

  const ticket = await prisma.supportTicket.update({
    where: { id: params.id },
    data: {
      ...(data.status !== undefined && { status: data.status }),
      ...(data.priority !== undefined && { priority: data.priority }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.resolution !== undefined && { resolution: data.resolution }),
      ...(data.assignedTo !== undefined && { assignedTo: data.assignedTo }),
      ...(isResolving && { resolvedAt: new Date() }),
    },
  });

  return NextResponse.json(ticket);
}
