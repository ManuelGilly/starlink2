import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Topbar } from "@/components/layout/topbar";
import { Badge } from "@/components/ui/badge";
import { formatUSD, formatDateTime } from "@/lib/utils";
import { EditPaymentForm } from "./edit-form";

export const dynamic = "force-dynamic";

export default async function PagoDetallePage({ params }: { params: { id: string } }) {
  const payment = await prisma.payment.findUnique({
    where: { id: params.id },
    include: {
      client: true,
      subscription: { include: { plan: true } },
      report: true,
    },
  });
  if (!payment) notFound();

  return (
    <>
      <Topbar title={`Pago · ${formatUSD(Number(payment.amount))}`} eyebrow="Finanzas" />
      <div className="p-8 space-y-4">
        <Card>
          <CardHeader><CardTitle>Información</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            <div><strong>Cliente:</strong> {payment.client.firstName} {payment.client.lastName}</div>
            <div><strong>Plan:</strong> {payment.subscription?.plan.name ?? "—"}</div>
            <div><strong>Monto:</strong> {formatUSD(Number(payment.amount))}</div>
            <div><strong>Método:</strong> {payment.method}</div>
            <div><strong>Estado:</strong> <Badge variant={payment.status === "CONFIRMADO" ? "success" : payment.status === "RECHAZADO" ? "destructive" : "secondary"}>{payment.status}</Badge></div>
            <div><strong>Referencia:</strong> {payment.reference ?? "—"}</div>
            <div><strong>Pagado:</strong> {formatDateTime(payment.paidAt)}</div>
            <div><strong>Confirmado:</strong> {formatDateTime(payment.confirmedAt)}</div>
            <div className="col-span-2 text-[11px] text-muted-foreground">
              Los pagos no se pueden borrar. Si necesitas anular uno, cámbialo a estado <span className="font-mono">RECHAZADO</span>.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Editar pago</CardTitle></CardHeader>
          <CardContent>
            <EditPaymentForm payment={JSON.parse(JSON.stringify(payment))} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
