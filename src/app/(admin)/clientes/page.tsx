import Link from "next/link";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Topbar } from "@/components/layout/topbar";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const clients = await prisma.client.findMany({
    include: { subscriptions: { include: { plan: true }, where: { status: "ACTIVA" } } },
    orderBy: { lastName: "asc" },
  });

  return (
    <>
      <Topbar title="Clientes" />
      <div className="p-6 space-y-4">
        <div className="flex justify-end">
          <Link href="/clientes/nuevo"><Button>+ Nuevo cliente</Button></Link>
        </div>
        <Card>
          <CardHeader><CardTitle>Directorio</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Planes activos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Link className="font-medium hover:underline" href={`/clientes/${c.id}`}>
                        {c.firstName} {c.lastName}
                      </Link>
                    </TableCell>
                    <TableCell>{c.documentId ?? "—"}</TableCell>
                    <TableCell>{c.email}</TableCell>
                    <TableCell>{c.phone}</TableCell>
                    <TableCell className="space-x-1">
                      {c.subscriptions.length === 0 && "—"}
                      {c.subscriptions.map((s) => (
                        <Badge key={s.id} variant="secondary">{s.plan.name}</Badge>
                      ))}
                    </TableCell>
                  </TableRow>
                ))}
                {clients.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Sin clientes aún</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
