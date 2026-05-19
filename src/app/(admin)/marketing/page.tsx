import Link from "next/link";
import { prisma } from "@/lib/db";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatUSD } from "@/lib/utils";
import { getCampaignMetrics } from "@/lib/marketing/metrics";
import { NewCampaignForm } from "./new-campaign-form";
import { TrendingUp, MessageSquare, Target, DollarSign } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  BORRADOR: "Borrador",
  ACTIVA: "Activa",
  PAUSADA: "Pausada",
  FINALIZADA: "Finalizada",
};
const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  ACTIVA: "default",
  PAUSADA: "secondary",
  FINALIZADA: "outline",
  BORRADOR: "secondary",
};

export default async function MarketingPage() {
  const campaigns = await prisma.adCampaign.findMany({
    orderBy: { startDate: "desc" },
    include: { _count: { select: { sales: true, subscriptions: true } } },
  });

  // Cargar métricas de todas las campañas en paralelo
  const metricsAll = campaigns.length > 0
    ? await Promise.all(campaigns.map((c) => getCampaignMetrics(c.id)))
    : [];

  const totalInvested = metricsAll.reduce((s, m) => s + m.investment, 0);
  const totalRevenue = metricsAll.reduce((s, m) => s + m.grossRevenue, 0);
  const totalProfit = metricsAll.reduce((s, m) => s + m.netProfit, 0);
  const totalMessages = metricsAll.reduce((s, m) => s + m.messagesReceived, 0);
  const overallRoas = totalInvested > 0 ? totalRevenue / totalInvested : 0;

  return (
    <>
      <Topbar title="Marketing & Ads" />
      <div className="p-6 space-y-6">

        {/* KPIs consolidados */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs uppercase tracking-wide">Invertido</span>
              </div>
              <p className="text-2xl font-bold font-mono">{formatUSD(totalInvested)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs uppercase tracking-wide">Generado</span>
              </div>
              <p className="text-2xl font-bold font-mono text-emerald-400">{formatUSD(totalRevenue)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Target className="h-4 w-4" />
                <span className="text-xs uppercase tracking-wide">Ganancia Neta</span>
              </div>
              <p className={`text-2xl font-bold font-mono ${totalProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {formatUSD(totalProfit)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <MessageSquare className="h-4 w-4" />
                <span className="text-xs uppercase tracking-wide">ROAS Global</span>
              </div>
              <p className="text-2xl font-bold font-mono">{overallRoas.toFixed(2)}×</p>
              <p className="text-xs text-muted-foreground mt-0.5">{totalMessages} mensajes totales</p>
            </CardContent>
          </Card>
        </div>

        {/* Nueva campaña */}
        <Card>
          <CardHeader><CardTitle>Nueva campaña</CardTitle></CardHeader>
          <CardContent>
            <NewCampaignForm />
          </CardContent>
        </Card>

        {/* Lista de campañas */}
        <Card>
          <CardHeader>
            <CardTitle>Campañas ({campaigns.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {campaigns.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                No hay campañas registradas. Crea la primera arriba.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {campaigns.map((c, idx) => {
                  const m = metricsAll[idx];
                  return (
                    <Link
                      key={c.id}
                      href={`/marketing/${c.id}`}
                      className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-accent/40 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{c.name}</span>
                          <Badge variant={STATUS_VARIANT[c.status] ?? "outline"}>
                            {STATUS_LABEL[c.status] ?? c.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{c.platform}</span>
                        </div>
                        <div className="mt-1 flex gap-4 text-xs text-muted-foreground flex-wrap">
                          <span>{formatDate(c.startDate)}{c.endDate ? ` → ${formatDate(c.endDate)}` : ""}</span>
                          <span>{c.messagesReceived} mensajes</span>
                          <span>{c._count.sales + c._count.subscriptions} conversiones</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 space-y-0.5">
                        <div className="text-xs text-muted-foreground">
                          Inv: <span className="font-mono text-foreground">{formatUSD(m.investment)}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Rev: <span className="font-mono text-emerald-400">{formatUSD(m.grossRevenue)}</span>
                        </div>
                        <div className="text-xs">
                          ROAS: <span className={`font-mono font-semibold ${m.roas >= 2 ? "text-emerald-400" : m.roas >= 1 ? "text-yellow-400" : "text-red-400"}`}>
                            {m.roas.toFixed(2)}×
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
