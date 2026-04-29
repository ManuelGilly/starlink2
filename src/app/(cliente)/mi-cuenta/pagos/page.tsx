import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Topbar } from "@/components/layout/topbar";
import { formatDate, formatUSD } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function MisPagosPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const client = await prisma.client.findFirst({ where: { userId: user.id } });
  if (!client) return <div className="p-6">Cliente no vinculado.</div>;
  const payments = await prisma.payment.findMany({
    where: { clientId: client.id },
    include: { subscription: { include: { plan: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <Topbar title="Mis pagos" />
      <div className="p-6">
        <Card>
          <CardHeader><CardTitle>Historial completo</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{formatDate(p.createdAt)}</TableCell>
                    <TableCell>{p.subscription?.plan.name ?? "—"}</TableCell>
                    <TableCell>{formatUSD(Number(p.amount))}</TableCell>
                    <TableCell>{p.method}</TableCell>
                    <TableCell>{p.reference ?? "—"}</TableCell>
                    <TableCell><Badge variant={p.status === "CONFIRMADO" ? "success" : p.status === "RECHAZADO" ? "destructive" : "secondary"}>{p.status}</Badge></TableCell>
                  </TableRow>
                ))}
                {payments.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Sin pagos</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
