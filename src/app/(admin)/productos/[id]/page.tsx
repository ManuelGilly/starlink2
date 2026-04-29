import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { stockForProduct } from "@/lib/inventory/stock";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatUSD, formatDate } from "@/lib/utils";
import { Topbar } from "@/components/layout/topbar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCurrentUser } from "@/lib/rbac";
import { EditProductForm } from "./edit-form";
import { DeleteButton } from "@/components/delete-button";

export const dynamic = "force-dynamic";

export default async function ProductoDetallePage({ params }: { params: { id: string } }) {
  const [product, user] = await Promise.all([
    prisma.product.findUnique({
      where: { id: params.id },
      include: { category: true, movements: { orderBy: { occurredAt: "desc" }, take: 100 } },
    }),
    getCurrentUser(),
  ]);
  if (!product) notFound();
  const stock = await stockForProduct(product.id);
  const isAdmin = user?.roles.includes("ADMIN");

  return (
    <>
      <Topbar title={`Producto: ${product.name}`} eyebrow="Operación" />
      <div className="p-8 space-y-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Información</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>SKU:</strong> {product.sku}</div>
              <div><strong>Categoría:</strong> {product.category?.name ?? "—"}</div>
              <div><strong>Costo:</strong> {formatUSD(Number(product.costPrice))}</div>
              <div><strong>Venta:</strong> {formatUSD(Number(product.salePrice))}</div>
              <div><strong>Stock actual:</strong> <Badge variant={stock <= product.minStock ? "destructive" : "secondary"}>{stock}</Badge></div>
              <div><strong>Stock mínimo:</strong> {product.minStock}</div>
              <div><strong>Garantía:</strong> {product.warrantyDays} días</div>
              <div><strong>Estado:</strong> {product.active ? "Activo" : "Inactivo"}</div>
              {product.description && <div className="col-span-2"><strong>Descripción:</strong> {product.description}</div>}
              {product.features && <div className="col-span-2"><strong>Características:</strong> {product.features}</div>}
            </CardContent>
          </Card>

          {isAdmin && (
            <Card>
              <CardHeader><CardTitle>Zona administrativa</CardTitle></CardHeader>
              <CardContent>
                <DeleteButton
                  endpoint={`/api/productos/${product.id}`}
                  entityLabel="producto"
                  entityName={product.name}
                  redirectTo="/productos"
                />
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader><CardTitle>Editar</CardTitle></CardHeader>
          <CardContent>
            <EditProductForm product={JSON.parse(JSON.stringify(product))} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Movimientos recientes</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Costo unit.</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead>Notas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {product.movements.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{formatDate(m.occurredAt)}</TableCell>
                    <TableCell><Badge variant="outline">{m.type}</Badge></TableCell>
                    <TableCell>{m.quantity}</TableCell>
                    <TableCell>{m.unitCost ? formatUSD(Number(m.unitCost)) : "—"}</TableCell>
                    <TableCell>{m.reference ?? "—"}</TableCell>
                    <TableCell>{m.notes ?? "—"}</TableCell>
                  </TableRow>
                ))}
                {product.movements.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Sin movimientos</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
