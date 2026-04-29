import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Topbar } from "@/components/layout/topbar";
import { formatDateTime, formatUSD } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PaymentActions } from "./actions";

export const dynamic = "force-dynamic";

export default async function PagosPage() {
  const [pending, confirmed] = await Promise.all([
    prisma.payment.findMany({
      where: { status: { in: ["REPORTADO", "PENDIENTE"] } },
      include: { client: true, subscription: { include: { plan: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.payment.findMany({
      where: { status: "CONFIRMADO" },
      include: { client: true },
      orderBy: { confirmedAt: "desc" },
      take: 30,
    }),
  ]);

  return (
    <>
      <Topbar title="Pagos" />
      <div className="p-6 space-y-4">
        <Card>
          <CardHeader><CardTitle>Por revisar ({pending.length})</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reportado</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Link className="hover:underline" href={`/pagos/${p.id}`}>{formatDateTime(p.createdAt)}</Link>
                    </TableCell>
                    <TableCell>{p.client.firstName} {p.client.lastName}</TableCell>
                    <TableCell>{p.subscription?.plan.name ?? "—"}</TableCell>
                    <TableCell>{formatUSD(Number(p.amount))}</TableCell>
                    <TableCell>{p.method}</TableCell>
                    <TableCell>{p.reference ?? "—"}</TableCell>
                    <TableCell><PaymentActions id={p.id} /></TableCell>
                  </TableRow>
                ))}
                {pending.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Sin pagos por revisar</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Confirmados (recientes)</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Confirmado</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {confirmed.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Link className="hover:underline" href={`/pagos/${p.id}`}>{formatDateTime(p.confirmedAt)}</Link>
                    </TableCell>
                    <TableCell>{p.client.firstName} {p.client.lastName}</TableCell>
                    <TableCell>{formatUSD(Number(p.amount))}</TableCell>
                    <TableCell>{p.method}</TableCell>
                    <TableCell><Badge variant="success">{p.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
