import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { Topbar } from "@/components/layout/topbar";
import { CobrosWorkspace } from "./workspace";
import { getVesRate } from "@/lib/payments/rate";

export const dynamic = "force-dynamic";

export default async function CobrosPage({
  searchParams,
}: {
  searchParams: { mes?: string };
}) {
  const { error } = await requireRole(["ADMIN", "INVENTARIO"]);
  if (error) return error;

  const today = new Date();
  let year = today.getFullYear();
  let month = today.getMonth() + 1; // 1-indexed

  if (searchParams.mes && /^\d{4}-\d{2}$/.test(searchParams.mes)) {
    const [y, m] = searchParams.mes.split("-").map(Number);
    if (y >= 2020 && y <= 2099 && m >= 1 && m <= 12) {
      year = y;
      month = m;
    }
  }

  const periodoInicio = new Date(year, month - 1, 1);
  const periodoFin = new Date(year, month, 0, 23, 59, 59, 999);

  const subscriptions = await prisma.subscription.findMany({
    where: { status: "ACTIVA" },
    include: { client: true, plan: true },
    orderBy: [{ client: { lastName: "asc" } }],
  });

  const subIds = subscriptions.map((s) => s.id);

  const pagos = subIds.length
    ? await prisma.payment.findMany({
        where: {
          subscriptionId: { in: subIds },
          status: "CONFIRMADO",
          periodStart: { gte: periodoInicio, lte: periodoFin },
        },
      })
    : [];

  const pagosPorSub: Record<string, (typeof pagos)[0]> = {};
  for (const p of pagos) {
    if (p.subscriptionId) pagosPorSub[p.subscriptionId] = p;
  }

  const rows = subscriptions.map((sub) => {
    const pago = pagosPorSub[sub.id] ?? null;
    return {
      subscriptionId: sub.id,
      clientId: sub.clientId,
      clientName: `${sub.client.firstName} ${sub.client.lastName}`,
      planName: sub.plan.name,
      planCost: sub.plan.cost != null ? Number(sub.plan.cost) : 0,
      priceLocked: Number(sub.priceLocked),
      pago: pago
        ? {
            id: pago.id,
            amount: Number(pago.amount),
            starlinkCost: pago.starlinkCost != null ? Number(pago.starlinkCost) : null,
            method: pago.method,
            reference: pago.reference,
          }
        : null,
    };
  });

  const rate = await getVesRate();

  return (
    <>
      <Topbar title="Cobros" />
      <CobrosWorkspace
        rows={rows}
        year={year}
        month={month}
        periodoInicio={periodoInicio.toISOString()}
        periodoFin={periodoFin.toISOString()}
        rate={rate}
      />
    </>
  );
}
