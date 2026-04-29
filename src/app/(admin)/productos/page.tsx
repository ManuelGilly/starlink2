import Link from "next/link";
import { prisma } from "@/lib/db";
import { stockForAllProducts } from "@/lib/inventory/stock";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatUSD } from "@/lib/utils";
import { Topbar } from "@/components/layout/topbar";

export const dynamic = "force-dynamic";

export default async function ProductosPage() {
  const [products, stock] = await Promise.all([
    prisma.product.findMany({ include: { category: true }, orderBy: { name: "asc" } }),
    stockForAllProducts(),
  ]);

  return (
    <>
      <Topbar title="Productos" />
      <div className="p-6 space-y-4">
        <div className="flex justify-end">
          <Link href="/productos/nuevo">
            <Button>+ Nuevo producto</Button>
          </Link>
        </div>
        <Card>
          <CardHeader><CardTitle>Catálogo</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Costo</TableHead>
                  <TableHead>Venta</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Mín.</TableHead>
                  <TableHead>Garantía</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => {
                  const s = stock[p.id] ?? 0;
                  const low = s <= p.minStock;
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                      <TableCell>
                        <Link className="font-medium underline-offset-2 hover:underline" href={`/productos/${p.id}`}>
                          {p.name}
                        </Link>
                      </TableCell>
                      <TableCell>{p.category?.name ?? "—"}</TableCell>
                      <TableCell>{formatUSD(Number(p.costPrice))}</TableCell>
                      <TableCell>{formatUSD(Number(p.salePrice))}</TableCell>
                      <TableCell>
                        <Badge variant={low ? "destructive" : "secondary"}>{s}</Badge>
                      </TableCell>
                      <TableCell>{p.minStock}</TableCell>
                      <TableCell>{p.warrantyDays} días</TableCell>
                      <TableCell>
                        <Badge variant={p.active ? "success" : "outline"}>{p.active ? "Activo" : "Inactivo"}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {products.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground">
                      Sin productos aún
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
