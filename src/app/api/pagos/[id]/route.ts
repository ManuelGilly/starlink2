import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser, requireRole } from "@/lib/rbac";
import { audit, getRequestInfo } from "@/lib/audit";
import { notifyPaymentConfirmed } from "@/lib/payments";

const schema = z.object({
  amount: z.coerce.number().positive().optional(),
  method: z.enum(["ZELLE", "PAYPAL", "BINANCE", "EFECTIVO_USD", "TRANSFERENCIA_USD", "OTRO"]).optional(),
  reference: z.string().nullable().optional(),
  status: z.enum(["PENDIENTE", "REPORTADO", "CONFIRMADO", "RECHAZADO"]).optional(),
  periodStart: z.string().datetime().nullable().optional(),
  periodEnd: z.string().datetime().nullable().optional(),
  paidAt: z.string().datetime().nullable().optional(),
  notes: z.string().nullable().optional(),
  subscriptionId: z.string().nullable().optional(),
});

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireRole(["ADMIN", "INVENTARIO"]);
  if (error) return error;
  const pay = await prisma.payment.findUnique({
    where: { id: params.id },
    include: { client: true, subscription: { include: { plan: true } } },
  });
  if (!pay) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(pay);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireRole(["ADMIN", "INVENTARIO"]);
  if (error) return error;
  const user = await getCurrentUser();

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const before = await prisma.payment.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const data: any = { ...parsed.data };
  if (data.periodStart) data.periodStart = new Date(data.periodStart);
  if (data.periodEnd) data.periodEnd = new Date(data.periodEnd);
  if (data.paidAt) data.paidAt = new Date(data.paidAt);

  // Si cambia a CONFIRMADO, sello de confirmación
  if (parsed.data.status === "CONFIRMADO" && before.status !== "CONFIRMADO") {
    data.confirmedAt = new Date();
    data.confirmedBy = user?.id ?? null;
  }
  // Si deja de ser CONFIRMADO, limpiar sello
  if (parsed.data.status && parsed.data.status !== "CONFIRMADO" && before.status === "CONFIRMADO") {
    data.confirmedAt = null;
    data.confirmedBy = null;
  }

  const updated = await prisma.payment.update({
    where: { id: params.id },
    data,
    include: { client: true },
  });

  const { ip, userAgent } = getRequestInfo(req);
  await audit({
    userId: user?.id,
    action: "UPDATE",
    entity: "Payment",
    entityId: updated.id,
    before,
    after: updated,
    ipAddress: ip,
    userAgent,
  });

  // Notificar por WhatsApp al cliente si pasó a CONFIRMADO
  if (parsed.data.status === "CONFIRMADO" && before.status !== "CONFIRMADO" && updated.client) {
    await notifyPaymentConfirmed(updated, updated.client);
  }

  return NextResponse.json(updated);
}

// DELETE = anular el pago (status RECHAZADO). No hard-delete: preserva auditoría.
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { error, user } = await requireRole("ADMIN");
  if (error) return error;

  const before = await prisma.payment.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (before.status === "RECHAZADO") {
    return NextResponse.json({ error: "El pago ya está anulado" }, { status: 409 });
  }

  const updated = await prisma.payment.update({
    where: { id: params.id },
    data: {
      status: "RECHAZADO",
      confirmedAt: null,
      confirmedBy: null,
      notes: before.notes ? `${before.notes}\n[Anulado por admin]` : "[Anulado por admin]",
    },
  });

  const { ip, userAgent } = getRequestInfo(req);
  await audit({
    userId: user?.id,
    action: "DELETE",
    entity: "Payment",
    entityId: updated.id,
    before,
    after: updated,
    ipAddress: ip,
    userAgent,
  });

  return NextResponse.json({ ok: true });
}
