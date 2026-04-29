import Link from "next/link";
import { getDashboardData } from "@/lib/metrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Topbar } from "@/components/layout/topbar";
import { formatUSD, formatDate } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowDownRight, ArrowUpRight, TrendingUp, Package, Users, AlertTriangle, ShieldAlert, Clock } from "lucide-react";
import {
  MonthlyBillingChart,
  CashflowChart,
  MethodsDonutChart,
  PlansBreakdownChart,
  InventoryHealthChart,
  PaymentStatusChart,
} from "@/components/dashboard/charts";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function Kpi({
  label,
  value,
  hint,
  tone = "default",
  delta,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "positive" | "warning" | "danger";
  delta?: { value: number; positive?: boolean };
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const valueColor =
    tone === "positive" ? "text-emerald-400" :
    tone === "warning" ? "text-amber-400" :
    tone === "danger" ? "text-destructive" : "text-foreground";

  return (
    <div className="relative overflow-hidden rounded-sm border border-border bg-card p-5 transition-colors hover:border-border/80">
      <div className="flex items-start justify-between">
        <div className="eyebrow">{label}</div>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </div>
      <div className={`mt-3 flex items-baseline gap-2 ${valueColor}`}>
        <div className="stat-value">{value}</div>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        {hint ? <div className="text-[11px] text-muted-foreground">{hint}</div> : <span />}
        {delta && (
          <div className={`flex items-center gap-1 text-[11px] font-medium ${delta.positive ? "text-emerald-400" : "text-destructive"}`}>
            {delta.positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(delta.value).toFixed(1)}%
          </div>
        )}
      </div>
    </div>
  );
}

function SectionTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between">
      <h2 className="section-title">{title}</h2>
      {hint && <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{hint}</span>}
    </div>
  );
}

export default async function DashboardPage() {
  const [data, recentPayments] = await Promise.all([
    getDashboardData(),
    prisma.payment.findMany({
      include: { client: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  const {
    kpis, monthly, byMethod, byStatus, byPlan, topClients, inventory, alerts,
  } = data;

  const revenueDelta =
    kpis.billingPrev30 > 0
      ? ((kpis.billingLast30 - kpis.billingPrev30) / kpis.billingPrev30) * 100
      : kpis.billingLast30 > 0 ? 100 : 0;

  const inventoryChartData = inventory.slice(0, 8).map((i) => ({ name: i.name, stock: i.stock, minStock: i.minStock }));

  return (
    <>
      <Topbar title="Dashboard" eyebrow="Panel ejecutivo" />
      <div className="space-y-8 p-8">
        {/* ---- KPIs financieros ---- */}
        <section>
          <SectionTitle title="Resumen financiero" hint="Mes en curso" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi
              label="Facturación mes"
              value={formatUSD(kpis.billingMonth)}
              tone="positive"
              icon={TrendingUp}
              hint={`Año: ${formatUSD(kpis.billingYear)}`}
            />
            <Kpi
              label="Ingresos últimos 30 días"
              value={formatUSD(kpis.billingLast30)}
              delta={{ value: revenueDelta, positive: revenueDelta >= 0 }}
              hint={`vs anteriores 30d: ${formatUSD(kpis.billingPrev30)}`}
            />
            <Kpi
              label="Ganancia bruta mes"
              value={formatUSD(kpis.grossProfitMonth)}
              tone={kpis.grossProfitMonth >= 0 ? "positive" : "danger"}
              hint={`Compras: ${formatUSD(kpis.purchasesMonth)}`}
            />
            <Kpi
              label="MRR (recurrente mensual)"
              value={formatUSD(kpis.mrr)}
              tone="positive"
              hint={`Ticket promedio: ${formatUSD(kpis.averageTicket)}`}
            />
          </div>
        </section>

        {/* ---- KPIs operacionales ---- */}
        <section>
          <SectionTitle title="Operación" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            <Kpi label="Clientes activos" value={String(kpis.activeClients)} icon={Users} />
            <Kpi label="Suscripciones" value={String(kpis.activeSubscriptions)} />
            <Kpi label="Pagos por revisar" value={String(kpis.reportedPaymentsCount)} tone={kpis.reportedPaymentsCount > 0 ? "warning" : "default"} icon={Clock} />
            <Kpi label="Pagos pendientes" value={formatUSD(kpis.pendingPaymentsAmount)} hint={`${kpis.pendingPaymentsCount} reg.`} tone="warning" />
            <Kpi label="Inversión inventario" value={formatUSD(kpis.inventoryInvestment)} hint={`Venta: ${formatUSD(kpis.inventoryValueAtSale)}`} icon={Package} />
            <Kpi label="Stock crítico" value={String(kpis.lowStockCount)} tone={kpis.lowStockCount > 0 ? "danger" : "positive"} icon={AlertTriangle} />
          </div>
        </section>

        {/* ---- Gráficos financieros ---- */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Facturación e ingresos · últimos 12 meses</CardTitle>
            </CardHeader>
            <CardContent>
              <MonthlyBillingChart data={monthly} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Métodos de pago</CardTitle>
            </CardHeader>
            <CardContent>
              {byMethod.length > 0 ? <MethodsDonutChart data={byMethod.map((b) => ({ key: b.key, amount: b.amount }))} /> : <EmptyState text="Sin pagos confirmados" />}
            </CardContent>
          </Card>
        </section>

        {/* ---- Flujo y estados ---- */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Ingresos vs compras</CardTitle>
            </CardHeader>
            <CardContent>
              <CashflowChart data={monthly.map((m) => ({ monthLabel: m.monthLabel, billing: m.billing, purchases: m.purchases }))} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Pagos por estado</CardTitle>
            </CardHeader>
            <CardContent>
              {byStatus.length > 0 ? <PaymentStatusChart data={byStatus} /> : <EmptyState text="Sin datos" />}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Suscripciones por plan</CardTitle>
            </CardHeader>
            <CardContent>
              {byPlan.length > 0 ? <PlansBreakdownChart data={byPlan} /> : <EmptyState text="Sin suscripciones activas" />}
            </CardContent>
          </Card>
        </section>

        {/* ---- Inventario + top clientes ---- */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Salud de inventario</CardTitle>
            </CardHeader>
            <CardContent>
              {inventoryChartData.length > 0 ? <InventoryHealthChart data={inventoryChartData} /> : <EmptyState text="Sin productos" />}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Top clientes (facturación)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Pagado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topClients.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="font-medium">{c.name}</div>
                        <div className="text-[11px] text-muted-foreground">{c.planName ?? "—"} · {c.paymentCount} pagos</div>
                      </TableCell>
                      <TableCell className="text-right font-mono">{formatUSD(c.totalPaid)}</TableCell>
                    </TableRow>
                  ))}
                  {topClients.length === 0 && (
                    <TableRow><TableCell colSpan={2} className="py-6 text-center text-muted-foreground">Sin datos</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>

        {/* ---- Alertas e inventario crítico ---- */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-3.5 w-3.5 text-amber-400" />Stock crítico</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Días</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.lowStock.slice(0, 8).map((p) => (
                    <TableRow key={p.productId}>
                      <TableCell>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-[11px] text-muted-foreground">min {p.minStock}</div>
                      </TableCell>
                      <TableCell className="text-right"><Badge variant="destructive">{p.stock}</Badge></TableCell>
                      <TableCell className="text-right font-mono text-[12px]">{p.criticalInDays !== null ? `${p.criticalInDays}d` : "—"}</TableCell>
                    </TableRow>
                  ))}
                  {alerts.lowStock.length === 0 && (
                    <TableRow><TableCell colSpan={3} className="py-6 text-center text-muted-foreground">Sin stock crítico</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShieldAlert className="h-3.5 w-3.5 text-amber-400" />Garantías próximas a vencer</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente / Producto</TableHead>
                    <TableHead className="text-right">Vence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.expiringWarranties.slice(0, 8).map((w) => (
                    <TableRow key={w.id}>
                      <TableCell>
                        <div className="font-medium">{w.clientName}</div>
                        <div className="text-[11px] text-muted-foreground">{w.productName}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-mono text-[12px]">{formatDate(w.endsAt)}</div>
                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{w.daysLeft}d</div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {alerts.expiringWarranties.length === 0 && (
                    <TableRow><TableCell colSpan={2} className="py-6 text-center text-muted-foreground">Sin garantías por vencer</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-amber-400" />Cobros vencidos del mes</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Plan</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.overdueSubscriptions.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="font-medium">{s.clientName}</div>
                        <div className="text-[11px] text-muted-foreground">día {s.billingDay}</div>
                      </TableCell>
                      <TableCell className="text-right text-[12px]">{s.planName}</TableCell>
                      <TableCell className="text-right font-mono text-[12px]">{formatUSD(s.amount)}</TableCell>
                    </TableRow>
                  ))}
                  {alerts.overdueSubscriptions.length === 0 && (
                    <TableRow><TableCell colSpan={3} className="py-6 text-center text-muted-foreground">Sin cobros vencidos</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>

        {/* ---- Pagos recientes ---- */}
        <Card>
          <CardHeader>
            <CardTitle>Pagos recientes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentPayments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-muted-foreground">{formatDate(p.createdAt)}</TableCell>
                    <TableCell className="font-medium">{p.client.firstName} {p.client.lastName}</TableCell>
                    <TableCell className="font-mono">{formatUSD(Number(p.amount))}</TableCell>
                    <TableCell className="text-muted-foreground text-[12px]">{p.method}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === "CONFIRMADO" ? "success" : p.status === "RECHAZADO" ? "destructive" : "secondary"}>
                        {p.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {recentPayments.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Sin pagos aún</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="flex h-[240px] items-center justify-center text-[13px] text-muted-foreground">{text}</div>;
}
