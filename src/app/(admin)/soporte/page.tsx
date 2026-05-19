import Link from "next/link";
import { prisma } from "@/lib/db";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { NewTicketForm } from "./new-ticket-form";
import { TicketActions } from "./ticket-actions";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = { ABIERTO: "Abierto", EN_PROCESO: "En proceso", RESUELTO: "Resuelto", CERRADO: "Cerrado" };
const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  ABIERTO: "destructive",
  EN_PROCESO: "default",
  RESUELTO: "secondary",
  CERRADO: "outline",
};
const PRIORITY_LABEL: Record<string, string> = { BAJA: "Baja", MEDIA: "Media", ALTA: "Alta", URGENTE: "Urgente" };
const PRIORITY_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  BAJA: "outline",
  MEDIA: "secondary",
  ALTA: "default",
  URGENTE: "destructive",
};
const TYPE_LABEL: Record<string, string> = { TECNICO: "Técnico", FACTURACION: "Facturación", CONSULTA: "Consulta", OTRO: "Otro" };

export default async function SoportePage() {
  const [allTickets, clients] = await Promise.all([
    prisma.supportTicket.findMany({
      include: { client: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
    }),
    prisma.client.findMany({ orderBy: [{ firstName: "asc" }, { lastName: "asc" }] }),
  ]);

  const abiertos = allTickets.filter((t) => t.status === "ABIERTO").length;
  const enProceso = allTickets.filter((t) => t.status === "EN_PROCESO").length;
  const resueltos = allTickets.filter((t) => t.status === "RESUELTO" || t.status === "CERRADO").length;
  const urgentes = allTickets.filter((t) => t.priority === "URGENTE" && t.status !== "CERRADO").length;

  const open = allTickets.filter((t) => t.status === "ABIERTO" || t.status === "EN_PROCESO");
  const closed = allTickets.filter((t) => t.status === "RESUELTO" || t.status === "CERRADO");

  return (
    <>
      <Topbar title="Soporte / Tickets" />
      <div className="p-6 space-y-4">

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card><CardContent className="pt-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Abiertos</p>
            <p className={`text-2xl font-bold ${abiertos > 0 ? "text-red-400" : ""}`}>{abiertos}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">En proceso</p>
            <p className="text-2xl font-bold text-yellow-400">{enProceso}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Resueltos</p>
            <p className="text-2xl font-bold text-emerald-400">{resueltos}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Urgentes activos</p>
            <p className={`text-2xl font-bold ${urgentes > 0 ? "text-red-400" : ""}`}>{urgentes}</p>
          </CardContent></Card>
        </div>

        {/* Nuevo ticket */}
        <Card>
          <CardHeader><CardTitle>Nuevo ticket</CardTitle></CardHeader>
          <CardContent>
            <NewTicketForm clients={JSON.parse(JSON.stringify(clients))} />
          </CardContent>
        </Card>

        {/* Tickets activos */}
        {open.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Activos ({open.length})</CardTitle></CardHeader>
            <CardContent className="p-0">
              <TicketTable tickets={open} />
            </CardContent>
          </Card>
        )}

        {/* Tickets cerrados */}
        {closed.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Historial ({closed.length})</CardTitle></CardHeader>
            <CardContent className="p-0">
              <TicketTable tickets={closed} dimmed />
            </CardContent>
          </Card>
        )}

        {allTickets.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              No hay tickets registrados
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}

function TicketTable({ tickets, dimmed = false }: { tickets: any[]; dimmed?: boolean }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Título</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Prioridad</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tickets.map((t) => (
          <TableRow key={t.id} className={dimmed ? "opacity-60" : ""}>
            <TableCell className="text-xs text-muted-foreground">{formatDate(t.createdAt)}</TableCell>
            <TableCell>
              <Link href={`/clientes/${t.clientId}`} className="hover:underline text-sm">
                {t.client.firstName} {t.client.lastName}
              </Link>
            </TableCell>
            <TableCell className="max-w-[200px]">
              <p className="font-medium text-sm truncate">{t.title}</p>
              <p className="text-xs text-muted-foreground truncate">{t.description}</p>
            </TableCell>
            <TableCell className="text-xs">{TYPE_LABEL[t.type] ?? t.type}</TableCell>
            <TableCell>
              <Badge variant={PRIORITY_VARIANT[t.priority] ?? "outline"}>
                {PRIORITY_LABEL[t.priority] ?? t.priority}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant={STATUS_VARIANT[t.status] ?? "outline"}>
                {STATUS_LABEL[t.status] ?? t.status}
              </Badge>
            </TableCell>
            <TableCell>
              <TicketActions ticket={JSON.parse(JSON.stringify(t))} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
