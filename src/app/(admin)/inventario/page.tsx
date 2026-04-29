import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Topbar } from "@/components/layout/topbar";
import { projectInventory } from "@/lib/inventory/projection";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NewMovementForm } from "./new-movement";
import { ProjectionForm } from "./projection-form";

export const dynamic = "force-dynamic";

export default async function InventarioPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const windowDays = Number(searchParams.windowDays ?? 30);
  const projectionDays = Number(searchParams.projectionDays ?? 30);

  const [products, projection, movs] = await Promise.all([
    prisma.product.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    projectInventory({ windowDays, projectionDays }),
    prisma.inventoryMovement.findMany({ include: { product: true }, orderBy: { occurredAt: "desc" }, take: 20 }),
  ]);

  return (
    <>
      <Topbar title="Inventario" />
      <div className="p-6 space-y-4">
        <Card>
          <CardHeader><CardTitle>Registrar movimiento</CardTitle></CardHeader>
          <CardContent>
            <NewMovementForm products={JSON.parse(JSON.stringify(products))} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Proyección de inventario</CardTitle>
            <p className="text-sm text-muted-foreground">
              Basada en salidas/mermas de los últimos {windowDays} días; horizonte: {projectionDays} días.
            </p>
          </CardHeader>
          <CardContent>
            <ProjectionForm initialWindow={windowDays} initialProjection={projectionDays} />
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Salidas ({windowDays}d)</TableHead>
                  <TableHead>Prom./día</TableHead>
                  <TableHead>Proyectado</TableHead>
                  <TableHead>Mínimo</TableHead>
                  <TableHead>Déficit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projection.map((i) => (
                  <TableRow key={i.productId}>
                    <TableCell>{i.name} <span className="text-xs text-muted-foreground">({i.sku})</span></TableCell>
                    <TableCell>{i.currentStock}</TableCell>
                    <TableCell>{i.outflowInWindow}</TableCell>
                    <TableCell>{i.avgDailyOutflow.toFixed(2)}</TableCell>
                    <TableCell>{i.projectedStock}</TableCell>
                    <TableCell>{i.minStock}</TableCell>
                    <TableCell>
                      {i.projectedDeficit > 0 ? (
                        <Badge variant="destructive">-{i.projectedDeficit}</Badge>
                      ) : (
                        <Badge variant="success">OK</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Últimos movimientos</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Referencia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movs.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{new Date(m.occurredAt).toLocaleString()}</TableCell>
                    <TableCell>{m.product.name}</TableCell>
                    <TableCell><Badge variant="outline">{m.type}</Badge></TableCell>
                    <TableCell>{m.quantity}</TableCell>
                    <TableCell>{m.reference ?? "—"}</TableCell>
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
