import Link from "next/link";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Topbar } from "@/components/layout/topbar";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const users = await prisma.user.findMany({
    include: { roles: { include: { role: true } }, client: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <Topbar title="Usuarios" />
      <div className="p-6 space-y-4">
        <div className="flex justify-end">
          <Link href="/usuarios/nuevo"><Button>+ Nuevo usuario</Button></Link>
        </div>
        <Card>
          <CardHeader><CardTitle>Usuarios del sistema</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Cliente vinculado</TableHead>
                  <TableHead>Último login</TableHead>
                  <TableHead>Activo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <Link className="font-medium hover:underline" href={`/usuarios/${u.id}`}>{u.name}</Link>
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell className="space-x-1">
                      {u.roles.map((r) => (<Badge key={r.roleId} variant="secondary">{r.role.name}</Badge>))}
                    </TableCell>
                    <TableCell>{u.client ? `${u.client.firstName} ${u.client.lastName}` : "—"}</TableCell>
                    <TableCell>{formatDateTime(u.lastLoginAt)}</TableCell>
                    <TableCell><Badge variant={u.active ? "success" : "outline"}>{u.active ? "Sí" : "No"}</Badge></TableCell>
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
