import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser, hasRole, requireRole } from "@/lib/rbac";
import { audit, getRequestInfo } from "@/lib/audit";

const schema = z.object({
  clientId: z.string().min(1),
  subscriptionId: z.string().optional().nullable(),
  amount: z.coerce.number().positive(),
  method: z.enum(["ZELLE", "PAYPAL", "BINANCE", "EFECTIVO_USD", "TRANSFERENCIA_USD", "OTRO"]),
  reference: z.string().optional().nullable(),
  periodStart: z.string().datetime().optional().nullable(),
  periodEnd: z.string().datetime().optional().nullable(),
  paidAt: z.string().datetime().optional().nullable(),
  status: z.enum(["PENDIENTE", "REPORTADO", "CONFIRMADO", "RECHAZADO"]).optional(),
  notes: z.string().optional().nullable(),
});

export async function GET(req: Request) {
  const { error } = await requireRole(["ADMIN", "INVENTARIO"]);
  if (error) return error;
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  return NextResponse.json(
    await prisma.payment.findMany({
      where: status ? { status: status as any } : undefined,
      include: { client: true, subscription: { include: { plan: true } } },
      orderBy: { createdAt: "desc" },
    }),
  );
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const isAdmin = hasRole(user.roles, ["ADMIN", "INVENTARIO"]);
  const status = parsed.data.status ?? (isAdmin ? "CONFIRMADO" : "REPORTADO");

  const created = await prisma.payment.create({
    data: {
      ...parsed.data,
      status,
      paidAt: parsed.data.paidAt ? new Date(parsed.data.paidAt) : null,
      periodStart: parsed.data.periodStart ? new Date(parsed.data.periodStart) : null,
      periodEnd: parsed.data.periodEnd ? new Date(parsed.data.periodEnd) : null,
      confirmedAt: status === "CONFIRMADO" ? new Date() : null,
      confirmedBy: status === "CONFIRMADO" ? user.id : null,
    },
  });

  const { ip, userAgent } = getRequestInfo(req);
  await audit({ userId: user.id, action: "CREATE", entity: "Payment", entityId: created.id, after: created, ipAddress: ip, userAgent });

  return NextResponse.json(created, { status: 201 });
}
