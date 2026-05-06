import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Topbar } from "@/components/layout/topbar";
import { Badge } from "@/components/ui/badge";
import { formatUSD, formatDateTime } from "@/lib/utils";
import { EditPaymentForm } from "./edit-form";
import { DeleteButton } from "@/components/delete-button";
import { getCurrentUser, hasRole } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function PagoDetallePage({ params }: { params: { id: string } }) {
  const [payment, user] = await Promise.all([
    prisma.payment.findUnique({
      where: { id: params.id },
      include: {
        client: true,
        subscription: { include: { plan: true } },
        report: true,
      },
    }),
    getCurrentUser(),
  ]);
  if (!payment) notFound();
  const isAdmin = hasRole(user?.roles, "ADMIN");
  const canAnnul = isAdmin && payment.status !== "RECHAZADO";

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
              Anular un pago lo deja en estado <span className="font-mono">RECHAZADO</span>; el registro se conserva en bitácora.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Editar pago</CardTitle></CardHeader>
          <CardContent>
            <EditPaymentForm payment={JSON.parse(JSON.stringify(payment))} />
          </CardContent>
        </Card>

        {canAnnul && (
          <Card>
            <CardHeader><CardTitle>Anular pago</CardTitle></CardHeader>
            <CardContent>
              <DeleteButton
                endpoint={`/api/pagos/${payment.id}`}
                entityLabel="pago"
                entityName={`${formatUSD(Number(payment.amount))} de ${payment.client.firstName} ${payment.client.lastName}`}
                redirectTo="/pagos"
                confirmWord="ANULAR"
              />
              <p className="mt-2 text-[11px] text-muted-foreground">
                El pago pasará a estado <span className="font-mono">RECHAZADO</span>. No se borra de la base; queda registrado en bitácora.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
