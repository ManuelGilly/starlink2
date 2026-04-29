import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Topbar } from "@/components/layout/topbar";
import { formatDateTime, formatUSD } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlanRequestActions } from "./actions";

export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<string, "default" | "success" | "destructive" | "secondary"> = {
  PENDIENTE: "secondary",
  PROCESADA: "success",
  RECHAZADA: "destructive",
};

export default async function SolicitudesActivacionPage() {
  const [pending, handled] = await Promise.all([
    prisma.planRequest.findMany({
      where: { status: "PENDIENTE" },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.planRequest.findMany({
      where: { status: { in: ["PROCESADA", "RECHAZADA"] } },
      include: { plan: true },
      orderBy: { reviewedAt: "desc" },
      take: 40,
    }),
  ]);

  return (
    <>
      <Topbar title="Solicitudes de activación" />
      <div className="space-y-4 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Pendientes ({pending.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recibida</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Antena</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Comprobante</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{formatDateTime(r.createdAt)}</TableCell>
                    <TableCell>
                      {r.firstName} {r.lastName}
                    </TableCell>
                    <TableCell>
                      <div className="text-[12px]">{r.email}</div>
                      <div className="text-[12px] text-muted-foreground">{r.phone}</div>
                    </TableCell>
                    <TableCell className="font-mono text-[12px]">{r.antennaId}</TableCell>
                    <TableCell>{r.plan.name}</TableCell>
                    <TableCell>{formatUSD(Number(r.amount))}</TableCell>
                    <TableCell>
                      <div className="text-[12px]">{r.paymentMethod}</div>
                      {r.paymentReference && (
                        <div className="text-[11px] text-muted-foreground">{r.paymentReference}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={r.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[12px] text-primary hover:underline"
                      >
                        Ver
                      </Link>
                    </TableCell>
                    <TableCell>
                      <PlanRequestActions id={r.id} />
                    </TableCell>
                  </TableRow>
                ))}
                {pending.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground">
                      Sin solicitudes pendientes
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historial reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Procesada</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Antena</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {handled.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{formatDateTime(r.reviewedAt)}</TableCell>
                    <TableCell>
                      {r.firstName} {r.lastName}
                    </TableCell>
                    <TableCell className="font-mono text-[12px]">{r.antennaId}</TableCell>
                    <TableCell>{r.plan.name}</TableCell>
                    <TableCell>{formatUSD(Number(r.amount))}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {handled.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Sin historial
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
