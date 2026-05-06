import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Topbar } from "@/components/layout/topbar";
import { getCurrentUser, hasRole } from "@/lib/rbac";
import { NewPaymentForm } from "./new-payment-form";

export const dynamic = "force-dynamic";

export default async function NuevoPagoPage() {
  const user = await getCurrentUser();
  if (!hasRole(user?.roles, "ADMIN")) redirect("/pagos");

  const clients = await prisma.client.findMany({
    orderBy: { lastName: "asc" },
    include: {
      subscriptions: {
        where: { status: "ACTIVA" },
        include: { plan: true },
      },
    },
  });

  const data = clients.map((c) => ({
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    subscriptions: c.subscriptions.map((s) => ({
      id: s.id,
      planName: s.plan.name,
      priceLocked: Number(s.priceLocked),
    })),
  }));

  return (
    <>
      <Topbar title="Nuevo pago" eyebrow="Finanzas" />
      <div className="p-6">
        <Card className="max-w-3xl">
          <CardHeader><CardTitle>Registrar pago manual</CardTitle></CardHeader>
          <CardContent>
            <NewPaymentForm clients={data} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
