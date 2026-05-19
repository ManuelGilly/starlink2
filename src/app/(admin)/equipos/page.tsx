import Link from "next/link";
import { prisma } from "@/lib/db";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatUSD } from "@/lib/utils";
import { NewEquipmentForm } from "./new-equipment-form";

export const dynamic = "force-dynamic";

const CONDITION_LABEL: Record<string, string> = {
  NUEVO: "Nuevo",
  USADO: "Usado",
  DANADO: "Dañado",
  DADO_DE_BAJA: "Dado de baja",
};
const CONDITION_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  NUEVO: "default",
  USADO: "secondary",
  DANADO: "destructive",
  DADO_DE_BAJA: "outline",
};

export default async function EquiposPage() {
  const [equipment, clients] = await Promise.all([
    prisma.equipment.findMany({
      where: { active: true },
      include: { client: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.client.findMany({ orderBy: [{ firstName: "asc" }, { lastName: "asc" }] }),
  ]);

  const asignados = equipment.filter((e) => e.clientId).length;
  const libres = equipment.filter((e) => !e.clientId).length;

  return (
    <>
      <Topbar title="Equipos / Antenas" />
      <div className="p-6 space-y-4">

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3">
          <Card><CardContent className="pt-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Total</p>
            <p className="text-2xl font-bold">{equipment.length}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Asignados</p>
            <p className="text-2xl font-bold text-emerald-400">{asignados}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Disponibles</p>
            <p className="text-2xl font-bold text-yellow-400">{libres}</p>
          </CardContent></Card>
        </div>

        {/* Formulario nuevo equipo */}
        <Card>
          <CardHeader><CardTitle>Registrar equipo</CardTitle></CardHeader>
          <CardContent>
            <NewEquipmentForm clients={JSON.parse(JSON.stringify(clients))} />
          </CardContent>
        </Card>

        {/* Lista */}
        <Card>
          <CardHeader><CardTitle>Inventario de equipos ({equipment.length})</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Nº Serie</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Cliente asignado</TableHead>
                  <TableHead>Compra</TableHead>
                  <TableHead>Costo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {equipment.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.model}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {e.serialNumber ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={CONDITION_VARIANT[e.condition] ?? "outline"}>
                        {CONDITION_LABEL[e.condition] ?? e.condition}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {e.client ? (
                        <Link href={`/clientes/${e.client.id}`} className="hover:underline text-sm">
                          {e.client.firstName} {e.client.lastName}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground text-sm">Sin asignar</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {e.purchaseDate ? formatDate(e.purchaseDate) : "—"}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {e.purchasePrice ? formatUSD(Number(e.purchasePrice)) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
                {equipment.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Sin equipos registrados
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
