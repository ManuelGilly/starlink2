import Link from "next/link";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatUSD } from "@/lib/utils";
import { Topbar } from "@/components/layout/topbar";

export const dynamic = "force-dynamic";

export default async function PlanesPage() {
  const plans = await prisma.plan.findMany({
    include: { _count: { select: { subscriptions: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <Topbar title="Planes" />
      <div className="p-6 space-y-4">
        <div className="flex justify-end">
          <Link href="/planes/nuevo"><Button>+ Nuevo plan</Button></Link>
        </div>
        <Card>
          <CardHeader><CardTitle>Catálogo de planes</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Ciclo</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Costo</TableHead>
                  <TableHead>Suscripciones</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.code}</TableCell>
                    <TableCell>
                      <Link className="font-medium hover:underline" href={`/planes/${p.id}`}>{p.name}</Link>
                    </TableCell>
                    <TableCell>{p.billingCycle}</TableCell>
                    <TableCell>{formatUSD(Number(p.price))}</TableCell>
                    <TableCell>{p.cost ? formatUSD(Number(p.cost)) : "—"}</TableCell>
                    <TableCell>{p._count.subscriptions}</TableCell>
                    <TableCell><Badge variant={p.active ? "success" : "outline"}>{p.active ? "Activo" : "Inactivo"}</Badge></TableCell>
                  </TableRow>
                ))}
                {plans.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Sin planes aún</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
