import { prisma } from "@/lib/db";
import { stockForAllProducts } from "@/lib/inventory/stock";

export interface AdminMetrics {
  billingMonth: number;
  billingYear: number;
  billingLast30: number;
  billingPrev30: number;
  pendingPaymentsAmount: number;
  pendingPaymentsCount: number;
  reportedPaymentsCount: number;
  inventoryInvestment: number;
  inventoryValueAtSale: number;
  purchasesMonth: number;
  grossProfitMonth: number;
  activeClients: number;
  activeSubscriptions: number;
  lowStockCount: number;
  averageTicket: number;
  mrr: number; // Monthly Recurring Revenue (suma de precios de subs activas mensuales)
}

export interface MonthlySeries {
  month: string;       // "2026-04"
  monthLabel: string;  // "Abr"
  billing: number;
  purchases: number;
  profit: number;
}

export interface ByKey {
  key: string;
  count: number;
  amount: number;
}

export interface TopClient {
  id: string;
  name: string;
  totalPaid: number;
  paymentCount: number;
  planName?: string;
}

export interface InventoryHealthItem {
  productId: string;
  sku: string;
  name: string;
  stock: number;
  minStock: number;
  avgDailyOutflow: number;
  daysOfInventory: number | null; // null si sin rotación
  criticalInDays: number | null;  // días hasta caer bajo minStock; null si seguro
  value: number;                  // stock * costPrice
}

export interface DashboardData {
  kpis: AdminMetrics;
  monthly: MonthlySeries[];
  byMethod: ByKey[];
  byStatus: ByKey[];
  byPlan: ByKey[];
  topClients: TopClient[];
  inventory: InventoryHealthItem[];
  alerts: {
    lowStock: InventoryHealthItem[];
    expiringWarranties: Array<{ id: string; clientName: string; productName: string; endsAt: Date; daysLeft: number }>;
    overdueSubscriptions: Array<{ id: string; clientName: string; planName: string; billingDay: number; amount: number }>;
  };
}

const MONTH_NAMES_ES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export async function getDashboardData(): Promise<DashboardData> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const last30 = new Date(now); last30.setDate(now.getDate() - 30);
  const prev30 = new Date(now); prev30.setDate(now.getDate() - 60);
  const last12mStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const warningSoon = new Date(now); warningSoon.setDate(now.getDate() + 30);

  const [
    billingMonthAgg,
    billingYearAgg,
    billingLast30Agg,
    billingPrev30Agg,
    pendingAgg,
    reportedCount,
    purchasesThisMonth,
    products,
    activeClients,
    activeSubs,
    paymentsMethodAgg,
    paymentsStatusAgg,
    subsByPlanAgg,
    confirmedPayments12m,
    purchases12m,
    topClientsAgg,
    subscriptionsWithPlan,
    warranties,
    overdueSubs,
  ] = await Promise.all([
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: "CONFIRMADO", confirmedAt: { gte: monthStart } },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: "CONFIRMADO", confirmedAt: { gte: yearStart } },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: "CONFIRMADO", confirmedAt: { gte: last30 } },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: "CONFIRMADO", confirmedAt: { gte: prev30, lt: last30 } },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      _count: true,
      where: { status: { in: ["PENDIENTE", "REPORTADO"] } },
    }),
    prisma.payment.count({ where: { status: "REPORTADO" } }),
    prisma.inventoryMovement.findMany({
      where: { type: "ENTRADA", occurredAt: { gte: monthStart } },
      select: { quantity: true, unitCost: true },
    }),
    prisma.product.findMany({ where: { active: true } }),
    prisma.client.count({ where: { subscriptions: { some: { status: "ACTIVA" } } } }),
    prisma.subscription.count({ where: { status: "ACTIVA" } }),
    prisma.payment.groupBy({
      by: ["method"],
      _sum: { amount: true },
      _count: true,
      where: { status: "CONFIRMADO" },
    }),
    prisma.payment.groupBy({
      by: ["status"],
      _sum: { amount: true },
      _count: true,
    }),
    prisma.subscription.groupBy({
      by: ["planId"],
      _count: true,
      _sum: { priceLocked: true },
      where: { status: "ACTIVA" },
    }),
    prisma.payment.findMany({
      where: { status: "CONFIRMADO", confirmedAt: { gte: last12mStart } },
      select: { amount: true, confirmedAt: true },
    }),
    prisma.inventoryMovement.findMany({
      where: { type: "ENTRADA", occurredAt: { gte: last12mStart } },
      select: { quantity: true, unitCost: true, occurredAt: true },
    }),
    prisma.payment.groupBy({
      by: ["clientId"],
      _sum: { amount: true },
      _count: true,
      where: { status: "CONFIRMADO" },
      orderBy: { _sum: { amount: "desc" } },
      take: 5,
    }),
    prisma.subscription.findMany({
      where: { status: "ACTIVA" },
      include: { plan: true, client: true },
    }),
    prisma.warranty.findMany({
      where: { status: "VIGENTE", endsAt: { lte: warningSoon } },
      include: { client: true, product: true },
      orderBy: { endsAt: "asc" },
      take: 10,
    }),
    // Suscripciones con billingDay ya vencido en el mes y sin pago confirmado este mes
    prisma.subscription.findMany({
      where: {
        status: "ACTIVA",
        billingDay: { lte: now.getDate() },
        payments: {
          none: { status: "CONFIRMADO", confirmedAt: { gte: monthStart } },
        },
      },
      include: { plan: true, client: true },
      take: 10,
    }),
  ]);

  // ---- Stocks y salud de inventario ----
  const stocks = await stockForAllProducts();

  const windowDays = 30;
  const windowStart = new Date(now); windowStart.setDate(now.getDate() - windowDays);
  const outflows = await prisma.inventoryMovement.groupBy({
    by: ["productId"],
    where: { type: { in: ["SALIDA", "MERMA"] }, occurredAt: { gte: windowStart } },
    _sum: { quantity: true },
  });
  const outflowMap: Record<string, number> = {};
  for (const o of outflows) outflowMap[o.productId] = o._sum.quantity ?? 0;

  let inventoryInvestment = 0;
  let inventoryValueAtSale = 0;
  let lowStockCount = 0;
  const inventory: InventoryHealthItem[] = [];

  for (const p of products) {
    const stock = stocks[p.id] ?? 0;
    const cost = Number(p.costPrice);
    const value = stock * cost;
    inventoryInvestment += value;
    inventoryValueAtSale += stock * Number(p.salePrice);
    if (stock <= p.minStock) lowStockCount++;

    const outflow30 = outflowMap[p.id] ?? 0;
    const avgDaily = outflow30 / windowDays;
    const daysOfInventory = avgDaily > 0 ? Math.round(stock / avgDaily) : null;
    const criticalInDays = avgDaily > 0 ? Math.max(0, Math.round((stock - p.minStock) / avgDaily)) : null;

    inventory.push({
      productId: p.id,
      sku: p.sku,
      name: p.name,
      stock,
      minStock: p.minStock,
      avgDailyOutflow: avgDaily,
      daysOfInventory,
      criticalInDays,
      value,
    });
  }
  inventory.sort((a, b) => {
    // críticos primero, luego los que se acaban antes
    const aCrit = a.stock <= a.minStock ? 0 : 1;
    const bCrit = b.stock <= b.minStock ? 0 : 1;
    if (aCrit !== bCrit) return aCrit - bCrit;
    const aDays = a.criticalInDays ?? Number.MAX_SAFE_INTEGER;
    const bDays = b.criticalInDays ?? Number.MAX_SAFE_INTEGER;
    return aDays - bDays;
  });

  const purchasesMonth = purchasesThisMonth.reduce(
    (acc, m) => acc + (m.unitCost ? Number(m.unitCost) * m.quantity : 0),
    0,
  );

  const billingMonth = Number(billingMonthAgg._sum.amount ?? 0);
  const billingYear = Number(billingYearAgg._sum.amount ?? 0);
  const billingLast30 = Number(billingLast30Agg._sum.amount ?? 0);
  const billingPrev30 = Number(billingPrev30Agg._sum.amount ?? 0);

  // ---- Serie mensual últimos 12 meses ----
  const monthlyMap = new Map<string, MonthlySeries>();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap.set(key, { month: key, monthLabel: MONTH_NAMES_ES[d.getMonth()], billing: 0, purchases: 0, profit: 0 });
  }
  for (const pay of confirmedPayments12m) {
    if (!pay.confirmedAt) continue;
    const d = pay.confirmedAt;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const row = monthlyMap.get(key);
    if (row) row.billing += Number(pay.amount);
  }
  for (const pur of purchases12m) {
    const d = pur.occurredAt;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const row = monthlyMap.get(key);
    if (row && pur.unitCost) row.purchases += Number(pur.unitCost) * pur.quantity;
  }
  const monthly = Array.from(monthlyMap.values()).map((r) => ({ ...r, profit: r.billing - r.purchases }));

  // ---- By method / status / plan ----
  const byMethod: ByKey[] = paymentsMethodAgg.map((m) => ({
    key: m.method,
    count: m._count,
    amount: Number(m._sum.amount ?? 0),
  }));
  const byStatus: ByKey[] = paymentsStatusAgg.map((m) => ({
    key: m.status,
    count: m._count,
    amount: Number(m._sum.amount ?? 0),
  }));

  const planIdToName = new Map<string, string>();
  const planIdToPrice = new Map<string, number>();
  for (const sub of subscriptionsWithPlan) {
    planIdToName.set(sub.planId, sub.plan.name);
    planIdToPrice.set(sub.planId, Number(sub.priceLocked));
  }
  const byPlan: ByKey[] = subsByPlanAgg.map((m) => ({
    key: planIdToName.get(m.planId) ?? "—",
    count: m._count,
    amount: Number(m._sum.priceLocked ?? 0),
  }));

  // MRR = suma de priceLocked donde el plan es MONTHLY
  let mrr = 0;
  for (const sub of subscriptionsWithPlan) {
    if (sub.plan.billingCycle === "MONTHLY") mrr += Number(sub.priceLocked);
  }

  // Top clientes
  const topClientIds = topClientsAgg.map((t) => t.clientId);
  const topClientsDetails = topClientIds.length
    ? await prisma.client.findMany({
        where: { id: { in: topClientIds } },
        include: { subscriptions: { where: { status: "ACTIVA" }, include: { plan: true }, take: 1 } },
      })
    : [];
  const topClients: TopClient[] = topClientsAgg.map((t) => {
    const client = topClientsDetails.find((c) => c.id === t.clientId);
    return {
      id: t.clientId,
      name: client ? `${client.firstName} ${client.lastName}` : "—",
      totalPaid: Number(t._sum.amount ?? 0),
      paymentCount: t._count,
      planName: client?.subscriptions[0]?.plan.name,
    };
  });

  // ---- Alertas ----
  const lowStock = inventory.filter((i) => i.stock <= i.minStock);
  const expiringWarranties = warranties.map((w) => {
    const daysLeft = Math.ceil((w.endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return {
      id: w.id,
      clientName: `${w.client.firstName} ${w.client.lastName}`,
      productName: w.product.name,
      endsAt: w.endsAt,
      daysLeft,
    };
  });
  const overdueSubscriptions = overdueSubs.map((s) => ({
    id: s.id,
    clientName: `${s.client.firstName} ${s.client.lastName}`,
    planName: s.plan.name,
    billingDay: s.billingDay,
    amount: Number(s.priceLocked),
  }));

  // Ticket promedio = facturación año / # pagos confirmados año
  const paymentsYear = byStatus.find((b) => b.key === "CONFIRMADO");
  const averageTicket = paymentsYear && paymentsYear.count > 0 ? billingYear / paymentsYear.count : 0;

  return {
    kpis: {
      billingMonth,
      billingYear,
      billingLast30,
      billingPrev30,
      pendingPaymentsAmount: Number(pendingAgg._sum.amount ?? 0),
      pendingPaymentsCount: pendingAgg._count ?? 0,
      reportedPaymentsCount: reportedCount,
      inventoryInvestment,
      inventoryValueAtSale,
      purchasesMonth,
      grossProfitMonth: billingMonth - purchasesMonth,
      activeClients,
      activeSubscriptions: activeSubs,
      lowStockCount,
      averageTicket,
      mrr,
    },
    monthly,
    byMethod: byMethod.sort((a, b) => b.amount - a.amount),
    byStatus,
    byPlan: byPlan.sort((a, b) => b.amount - a.amount),
    topClients,
    inventory,
    alerts: {
      lowStock,
      expiringWarranties,
      overdueSubscriptions,
    },
  };
}

// Mantener export anterior por compatibilidad
export async function computeAdminMetrics(): Promise<AdminMetrics> {
  const d = await getDashboardData();
  return d.kpis;
}
