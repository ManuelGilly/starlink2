import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ADMIN_OR_INV, requireRole } from "@/lib/rbac";

const schema = z.object({
  clientId: z.string().min(1),
  type: z.enum(["TECNICO", "FACTURACION", "CONSULTA", "OTRO"]).default("TECNICO"),
  priority: z.enum(["BAJA", "MEDIA", "ALTA", "URGENTE"]).default("MEDIA"),
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  assignedTo: z.string().nullable().optional(),
});

export async function GET(req: Request) {
  const { error } = await requireRole(ADMIN_OR_INV);
  if (error) return error;

  const url = new URL(req.url);
  const clientId = url.searchParams.get("clientId");
  const status = url.searchParams.get("status");

  const tickets = await prisma.supportTicket.findMany({
    where: {
      ...(clientId ? { clientId } : {}),
      ...(status ? { status: status as any } : { status: { in: ["ABIERTO", "EN_PROCESO"] } }),
    },
    include: { client: { select: { id: true, firstName: true, lastName: true } } },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(tickets);
}

export async function POST(req: Request) {
  const { error } = await requireRole(ADMIN_OR_INV);
  if (error) return error;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;
  const ticket = await prisma.supportTicket.create({
    data: {
      clientId: data.clientId,
      type: data.type,
      priority: data.priority,
      title: data.title,
      description: data.description,
      assignedTo: data.assignedTo ?? undefined,
    },
    include: { client: { select: { id: true, firstName: true, lastName: true } } },
  });

  return NextResponse.json(ticket, { status: 201 });
}
