import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Topbar } from "@/components/layout/topbar";
import { formatDate, formatUSD } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function MiCuentaPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const client = await prisma.client.findFirst({
    where: { userId: user.id },
    include: {
      subscriptions: { include: { plan: true }, where: { status: "ACTIVA" } },
      payments: { orderBy: { createdAt: "desc" }, take: 10 },
      warranties: { include: { product: true } },
      sales: { include: { items: { include: { product: true } } }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!client) {
    return (
      <>
        <Topbar title="Mi cuenta" />
        <div className="p-6">
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Tu usuario aún no está vinculado a un cliente. Contacta al administrador.
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const activeWarranties = client.warranties.filter((w) => w.status === "VIGENTE").length;
  const totalPaid = client.payments
    .filter((p) => p.status === "CONFIRMADO")
    .reduce((acc, p) => acc + Number(p.amount), 0);

  return (
    <>
      <Topbar title="Mi cuenta" />
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-4 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Planes activos</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{client.subscriptions.length}</CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total pagado</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{formatUSD(totalPaid)}</CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Garantías vigentes</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{activeWarranties}</CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Productos comprados</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{client.sales.reduce((a, s) => a + s.items.length, 0)}</CardContent></Card>
        </div>

        <div className="flex justify-end">
          <Link href="/mi-cuenta/reportar-pago"><Button>Reportar pago</Button></Link>
        </div>

        <Card>
          <CardHeader><CardTitle>Mis planes</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Día de corte</TableHead>
                  <TableHead>Inicio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {client.subscriptions.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.plan.name}</TableCell>
                    <TableCell>{formatUSD(Number(s.priceLocked))}</TableCell>
                    <TableCell>{s.billingDay}</TableCell>
                    <TableCell>{formatDate(s.startDate)}</TableCell>
                  </TableRow>
                ))}
                {client.subscriptions.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Sin planes activos</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Últimos pagos</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {client.payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{formatDate(p.createdAt)}</TableCell>
                    <TableCell>{formatUSD(Number(p.amount))}</TableCell>
                    <TableCell>{p.method}</TableCell>
                    <TableCell><Badge variant={p.status === "CONFIRMADO" ? "success" : p.status === "RECHAZADO" ? "destructive" : "secondary"}>{p.status}</Badge></TableCell>
                  </TableRow>
                ))}
                {client.payments.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Sin pagos aún</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Mis productos y garantías</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Serie</TableHead>
                  <TableHead>Vence</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {client.warranties.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell>{w.product.name}</TableCell>
                    <TableCell>{w.serialNumber ?? "—"}</TableCell>
                    <TableCell>{formatDate(w.endsAt)}</TableCell>
                    <TableCell><Badge variant={w.status === "VIGENTE" ? "success" : "outline"}>{w.status}</Badge></TableCell>
                  </TableRow>
                ))}
                {client.warranties.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Sin productos</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
