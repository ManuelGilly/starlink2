import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatUSD } from "@/lib/utils";
import { Topbar } from "@/components/layout/topbar";
import { EditPlanForm } from "./edit-form";
import { DeleteButton } from "@/components/delete-button";
import { getCurrentUser } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function PlanDetallePage({ params }: { params: { id: string } }) {
  const [plan, user] = await Promise.all([
    prisma.plan.findUnique({
      where: { id: params.id },
      include: { subscriptions: { include: { client: true } } },
    }),
    getCurrentUser(),
  ]);
  if (!plan) notFound();
  const isAdmin = user?.roles.includes("ADMIN");

  return (
    <>
      <Topbar title={`Plan: ${plan.name}`} />
      <div className="p-6 space-y-4">
        <Card>
          <CardHeader><CardTitle>Detalle</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div><strong>Código:</strong> {plan.code}</div>
            <div><strong>Ciclo:</strong> {plan.billingCycle}</div>
            <div><strong>Precio:</strong> {formatUSD(Number(plan.price))}</div>
            <div><strong>Costo:</strong> {plan.cost ? formatUSD(Number(plan.cost)) : "—"}</div>
            <div><strong>Estado:</strong> <Badge variant={plan.active ? "success" : "outline"}>{plan.active ? "Activo" : "Inactivo"}</Badge></div>
            <div><strong>Suscripciones:</strong> {plan.subscriptions.length}</div>
            {plan.description && <div className="col-span-2"><strong>Descripción:</strong> {plan.description}</div>}
            {plan.details && <div className="col-span-2"><strong>Detalle:</strong> {plan.details}</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Editar</CardTitle></CardHeader>
          <CardContent><EditPlanForm plan={JSON.parse(JSON.stringify(plan))} /></CardContent>
        </Card>

        {isAdmin && (
          <Card>
            <CardHeader><CardTitle>Zona administrativa</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {plan.subscriptions.length > 0 && (
                <div className="rounded-sm border border-amber-500/30 bg-amber-500/10 p-3 text-[12px]">
                  <div className="font-medium text-amber-400">Atención</div>
                  <div className="mt-1 text-muted-foreground">
                    Al borrar este plan se eliminarán también{" "}
                    <strong className="text-foreground">{plan.subscriptions.length} suscripciones</strong> asociadas en cascada.
                    Los pagos históricos se conservan pero pierden el enlace a la suscripción.
                  </div>
                </div>
              )}
              <DeleteButton
                endpoint={`/api/planes/${plan.id}`}
                entityLabel="plan"
                entityName={plan.name}
                redirectTo="/planes"
                confirmWord={plan.subscriptions.length > 0 ? plan.code.toUpperCase() : undefined}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
