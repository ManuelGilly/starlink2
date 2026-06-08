import { prisma } from "@/lib/db";
import { requireRole, ADMIN_OR_INV } from "@/lib/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Topbar } from "@/components/layout/topbar";
import { formatDate, formatUSD } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NewLotForm } from "./new-lot-form";

export const dynamic = "force-dynamic";

export default async function ComprasPage() {
  const { error } = await requireRole(ADMIN_OR_INV);
  if (error) return error;

  const [lots, products] = await Promise.all([
    prisma.purchaseLot.findMany({
      include: { product: true, _count: { select: { units: true } } },
      orderBy: { purchasedAt: "desc" },
      take: 50,
    }),
    prisma.product.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, sku: true, name: true, serialized: true } }),
  ]);

  const totalInvertido = lots.reduce((acc, l) => acc + Number(l.landedTotal), 0);

  return (
    <>
      <Topbar title="Compras / Lotes" />
      <div className="p-6 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Registrar lote de compra</CardTitle>
          </CardHeader>
          <CardContent>
            <NewLotForm products={JSON.parse(JSON.stringify(products))} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Lotes recientes ({lots.length}) · Invertido {formatUSD(totalInvertido)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Cant.</TableHead>
                  <TableHead className="text-right">Base</TableHead>
                  <TableHead className="text-right">Flete</TableHead>
                  <TableHead className="text-right">Imp.</TableHead>
                  <TableHead className="text-right">Costo real/u</TableHead>
                  <TableHead>Ref.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lots.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>{formatDate(l.purchasedAt)}</TableCell>
                    <TableCell className="text-sm">
                      {l.product.name}
                      {l.product.serialized && (
                        <span className="ml-1 text-[11px] text-muted-foreground">· {l._count.units} uds</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono">{l.quantity}</TableCell>
                    <TableCell className="text-right font-mono">{formatUSD(Number(l.baseTotal))}</TableCell>
                    <TableCell className="text-right font-mono">{formatUSD(Number(l.freightTotalUSD))}</TableCell>
                    <TableCell className="text-right font-mono">{formatUSD(Number(l.taxTotalUSD))}</TableCell>
                    <TableCell className="text-right font-mono font-semibold text-primary">{formatUSD(Number(l.landedUnitCost))}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{l.reference ?? "—"}</TableCell>
                  </TableRow>
                ))}
                {lots.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      Sin lotes registrados
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
