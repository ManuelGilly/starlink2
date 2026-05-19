import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatUSD } from "@/lib/utils";
import { getCampaignMetrics, getProductBreakdownByCampaign } from "@/lib/marketing/metrics";
import { EditCampaignPanel } from "./edit-panel";
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";

export const dynamic = "force-dynamic";

function MetricCard({
  label,
  value,
  sub,
  positive,
}: {
  label: string;
  value: string;
  sub?: string;
  positive?: boolean | null;
}) {
  const color =
    positive === true
      ? "text-emerald-400"
      : positive === false
      ? "text-red-400"
      : "text-foreground";
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
        <p className={`text-xl font-bold font-mono ${color}`}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default async function CampaignDetailPage({ params }: { params: { id: string } }) {
  const campaign = await prisma.adCampaign.findUnique({
    where: { id: params.id },
    include: {
      sales: {
        include: { client: true, items: { include: { product: true } } },
        orderBy: { createdAt: "desc" },
      },
      subscriptions: {
        include: { client: true, plan: true, payments: { where: { status: "CONFIRMADO" } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!campaign) notFound();

  const [metrics, breakdown] = await Promise.all([
    getCampaignMetrics(params.id),
    getProductBreakdownByCampaign(params.id),
  ]);

  const roasPositive = metrics.roas >= 1;
  const roiPositive = metrics.roi >= 0;

  return (
    <>
      <Topbar title={campaign.name} />
      <div className="p-6 space-y-6">

        {/* Back + status */}
        <div className="flex items-center gap-3 flex-wrap">
          <Link href="/marketing" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Campañas
          </Link>
          <Badge>{campaign.status}</Badge>
          <span className="text-sm text-muted-foreground">{campaign.platform}</span>
          {campaign.adUrl && (
            <a href={campaign.adUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">
              Ver anuncio ↗
            </a>
          )}
        </div>

        {/* KPIs principales */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <MetricCard label="Invertido" value={formatUSD(metrics.investment)} />
          <MetricCard label="Ingreso bruto" value={formatUSD(metrics.grossRevenue)} positive={metrics.grossRevenue > 0} />
          <MetricCard label="Costo mercancía" value={formatUSD(metrics.cogs)} />
          <MetricCard label="Ganancia neta" value={formatUSD(metrics.netProfit)} positive={metrics.netProfit >= 0} />
          <MetricCard
            label="ROAS"
            value={`${metrics.roas.toFixed(2)}×`}
            sub="ingresos / inversión"
            positive={roasPositive}
          />
          <MetricCard
            label="ROI"
            value={`${metrics.roi.toFixed(1)}%`}
            sub="retorno neto"
            positive={roiPositive}
          />
        </div>

        {/* KPIs de leads */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricCard label="Mensajes recibidos" value={metrics.messagesReceived.toString()} />
          <MetricCard
            label="Costo por lead"
            value={formatUSD(metrics.costPerLead)}
            sub="inversión / mensajes"
          />
          <MetricCard
            label="Conversiones"
            value={metrics.totalConversions.toString()}
            sub={`${metrics.productSalesCount} ventas · ${metrics.subscriptionSalesCount} subs`}
          />
          <MetricCard
            label="Tasa conversión"
            value={`${metrics.conversionRate.toFixed(1)}%`}
            sub="conversiones / mensajes"
            positive={metrics.conversionRate >= 10}
          />
        </div>

        {/* Split de ganancias */}
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
              División de ganancias (50 / 50)
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Ingresos productos</p>
                <p className="font-mono font-semibold">{formatUSD(metrics.productRevenue)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ingresos suscripciones</p>
                <p className="font-mono font-semibold">{formatUSD(metrics.subscriptionRevenue)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tu parte (50%)</p>
                <p className={`font-mono text-lg font-bold ${metrics.mySplit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {formatUSD(metrics.mySplit)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Parte socio (50%)</p>
                <p className={`font-mono text-lg font-bold ${metrics.partnerSplit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {formatUSD(metrics.partnerSplit)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Desglose por producto */}
        {breakdown.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Productos vendidos vía esta campaña</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Unidades</TableHead>
                    <TableHead className="text-right">Ingresos</TableHead>
                    <TableHead className="text-right">COGS</TableHead>
                    <TableHead className="text-right">Ganancia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {breakdown.map((b) => (
                    <TableRow key={b.productId}>
                      <TableCell className="font-medium">{b.productName}</TableCell>
                      <TableCell className="text-muted-foreground text-xs font-mono">{b.sku}</TableCell>
                      <TableCell className="text-right">{b.unitsSold}</TableCell>
                      <TableCell className="text-right font-mono">{formatUSD(b.revenue)}</TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">{formatUSD(b.cogs)}</TableCell>
                      <TableCell className={`text-right font-mono font-semibold ${b.profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {formatUSD(b.profit)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Ventas de productos vinculadas */}
        {campaign.sales.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Ventas de productos vinculadas ({campaign.sales.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Productos</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaign.sales.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="text-xs">{formatDate(s.createdAt)}</TableCell>
                      <TableCell>
                        <Link href={`/clientes/${s.clientId}`} className="hover:underline text-sm">
                          {s.client.firstName} {s.client.lastName}
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {s.items.map((it) => `${it.quantity}× ${it.product.name}`).join(", ")}
                      </TableCell>
                      <TableCell className="text-right font-mono">{formatUSD(Number(s.total))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Suscripciones vinculadas */}
        {campaign.subscriptions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Suscripciones activadas ({campaign.subscriptions.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead className="text-right">Pagos confirmados</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaign.subscriptions.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="text-xs">{formatDate(s.startDate)}</TableCell>
                      <TableCell>
                        <Link href={`/clientes/${s.clientId}`} className="hover:underline text-sm">
                          {s.client.firstName} {s.client.lastName}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm">{s.plan.name}</TableCell>
                      <TableCell className="text-right font-mono">{formatUSD(Number(s.priceLocked))}</TableCell>
                      <TableCell className="text-right font-mono text-emerald-400">
                        {formatUSD(s.payments.reduce((sum, p) => sum + Number(p.amount), 0))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Editar campaña */}
        <EditCampaignPanel campaign={JSON.parse(JSON.stringify(campaign))} />

      </div>
    </>
  );
}
