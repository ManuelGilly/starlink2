import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Topbar } from "@/components/layout/topbar";
import { formatDate } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function MisGarantiasPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const client = await prisma.client.findFirst({ where: { userId: user.id } });
  if (!client) return <div className="p-6">Cliente no vinculado.</div>;
  const warranties = await prisma.warranty.findMany({
    where: { clientId: client.id },
    include: { product: true },
    orderBy: { endsAt: "asc" },
  });

  return (
    <>
      <Topbar title="Mis garantías" />
      <div className="p-6">
        <Card>
          <CardHeader><CardTitle>Garantías</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Serie</TableHead>
                  <TableHead>Inicio</TableHead>
                  <TableHead>Vence</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {warranties.map((w) => {
                  const today = new Date();
                  const expired = w.endsAt < today;
                  const status = expired && w.status === "VIGENTE" ? "VENCIDA" : w.status;
                  return (
                    <TableRow key={w.id}>
                      <TableCell>{w.product.name}</TableCell>
                      <TableCell>{w.serialNumber ?? "—"}</TableCell>
                      <TableCell>{formatDate(w.startsAt)}</TableCell>
                      <TableCell>{formatDate(w.endsAt)}</TableCell>
                      <TableCell>
                        <Badge variant={status === "VIGENTE" ? "success" : status === "VENCIDA" ? "destructive" : "outline"}>
                          {status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {warranties.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Sin garantías</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
