import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Topbar } from "@/components/layout/topbar";
import { formatDate, formatUSD } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NewSaleForm } from "./new-sale-form";

export const dynamic = "force-dynamic";

export default async function VentasPage() {
  const [sales, clients, products] = await Promise.all([
    prisma.sale.findMany({
      include: { client: true, items: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.client.findMany({ orderBy: [{ firstName: "asc" }, { lastName: "asc" }] }),
    prisma.product.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  const totalAll = sales.reduce((acc, s) => acc + Number(s.total), 0);

  return (
    <>
      <Topbar title="Ventas" />
      <div className="p-6 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Registrar venta</CardTitle>
          </CardHeader>
          <CardContent>
            <NewSaleForm
              clients={JSON.parse(JSON.stringify(clients))}
              products={JSON.parse(JSON.stringify(products))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Ventas recientes ({sales.length}) · Total {formatUSD(totalAll)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Productos</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Notas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{formatDate(s.createdAt)}</TableCell>
                    <TableCell>
                      <Link className="hover:underline" href={`/clientes/${s.clientId}`}>
                        {s.client.firstName} {s.client.lastName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm">
                      {s.items.map((it) => (
                        <div key={it.id}>
                          {it.quantity}× {it.product.name}{" "}
                          <span className="text-muted-foreground">({formatUSD(Number(it.unitPrice))})</span>
                        </div>
                      ))}
                    </TableCell>
                    <TableCell className="font-mono">{formatUSD(Number(s.total))}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.notes ?? "—"}</TableCell>
                  </TableRow>
                ))}
                {sales.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Sin ventas registradas
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
