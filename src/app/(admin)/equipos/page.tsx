import { prisma } from "@/lib/db";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NewEquipmentForm } from "./new-equipment-form";
import { EquipmentTable } from "./equipment-table";

export const dynamic = "force-dynamic";

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
            <EquipmentTable
              equipment={JSON.parse(JSON.stringify(equipment))}
              clients={JSON.parse(JSON.stringify(clients))}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
