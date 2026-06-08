import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser, hasRole, requireRole } from "@/lib/rbac";
import { audit, getRequestInfo } from "@/lib/audit";
import { notifyPaymentConfirmed } from "@/lib/payments";
import { normalizeSplits, type SplitInput } from "@/lib/payments/splits";

const methodEnum = z.enum(["ZELLE", "PAYPAL", "BINANCE", "EFECTIVO_USD", "TRANSFERENCIA_USD", "PAGO_MOVIL", "OTRO"]);

const splitSchema = z.object({
  method: methodEnum,
  amountUSD: z.coerce.number().nonnegative().optional().nullable(),
  amountVes: z.coerce.number().nonnegative().optional().nullable(),
  vesRate: z.coerce.number().positive().optional().nullable(),
  reference: z.string().optional().nullable(),
});

const schema = z.object({
  clientId: z.string().min(1),
  subscriptionId: z.string().optional().nullable(),
  saleId: z.string().optional().nullable(),
  // Nuevo: pago dividido en varios métodos (+ Bs/tasa). Opcional para compatibilidad.
  splits: z.array(splitSchema).optional(),
  // Legacy: método + monto únicos (se convierten a un split).
  amount: z.coerce.number().positive().optional(),
  method: methodEnum.optional(),
  starlinkCost: z.coerce.number().nonnegative().optional().nullable(),
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
  const d = parsed.data;

  const isAdmin = hasRole(user.roles, ["ADMIN", "INVENTARIO"]);
  const status = d.status ?? (isAdmin ? "CONFIRMADO" : "REPORTADO");

  // Construir los splits: del array nuevo, o del legacy (método+monto único).
  const splitInputs: SplitInput[] =
    d.splits && d.splits.length > 0
      ? d.splits
      : d.method && d.amount != null
        ? [{ method: d.method, amountUSD: d.amount, reference: d.reference }]
        : [];

  let normalized;
  try {
    normalized = normalizeSplits(splitInputs);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Pago inválido" }, { status: 400 });
  }
  const primaryMethod = normalized.splits[0].method;

  const created = await prisma.payment.create({
    data: {
      clientId: d.clientId,
      subscriptionId: d.subscriptionId ?? null,
      saleId: d.saleId ?? null,
      amount: normalized.totalUSD,
      method: primaryMethod,
      reference: d.reference ?? normalized.splits[0].reference,
      starlinkCost: d.starlinkCost ?? null,
      notes: d.notes ?? null,
      status,
      paidAt: d.paidAt ? new Date(d.paidAt) : null,
      periodStart: d.periodStart ? new Date(d.periodStart) : null,
      periodEnd: d.periodEnd ? new Date(d.periodEnd) : null,
      confirmedAt: status === "CONFIRMADO" ? new Date() : null,
      confirmedBy: status === "CONFIRMADO" ? user.id : null,
      splits: { create: normalized.splits },
    },
    include: { client: true },
  });

  const { ip, userAgent } = getRequestInfo(req);
  await audit({ userId: user.id, action: "CREATE", entity: "Payment", entityId: created.id, after: created, ipAddress: ip, userAgent });

  if (status === "CONFIRMADO") {
    await notifyPaymentConfirmed(created, created.client);
  }

  return NextResponse.json(created, { status: 201 });
}
