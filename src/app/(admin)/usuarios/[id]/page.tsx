import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Topbar } from "@/components/layout/topbar";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { getCurrentUser } from "@/lib/rbac";
import { EditUserForm } from "./edit-form";
import { DeleteButton } from "@/components/delete-button";

export const dynamic = "force-dynamic";

export default async function UsuarioDetallePage({ params }: { params: { id: string } }) {
  const [user, admin] = await Promise.all([
    prisma.user.findUnique({
      where: { id: params.id },
      include: { roles: { include: { role: true } }, client: true },
    }),
    getCurrentUser(),
  ]);
  if (!user) notFound();
  const isSelf = admin?.id === user.id;

  return (
    <>
      <Topbar title={`Usuario: ${user.name}`} eyebrow="Sistema" />
      <div className="p-8 space-y-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Información</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              <div><strong>Email:</strong> {user.email}</div>
              <div><strong>Estado:</strong> <Badge variant={user.active ? "success" : "outline"}>{user.active ? "Activo" : "Inactivo"}</Badge></div>
              <div><strong>Último login:</strong> {formatDateTime(user.lastLoginAt)}</div>
              <div><strong>Creado:</strong> {formatDateTime(user.createdAt)}</div>
              <div className="col-span-2">
                <strong>Roles:</strong>{" "}
                {user.roles.map((r) => (<Badge key={r.roleId} variant="secondary" className="mr-1">{r.role.name}</Badge>))}
              </div>
              {user.client && (
                <div className="col-span-2">
                  <strong>Cliente vinculado:</strong> {user.client.firstName} {user.client.lastName}
                </div>
              )}
              {user.mustChangePassword && (
                <div className="col-span-2 text-amber-400 text-[12px]">
                  El usuario debe cambiar su contraseña en el próximo inicio de sesión.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Zona administrativa</CardTitle></CardHeader>
            <CardContent>
              {isSelf ? (
                <p className="text-[12px] text-muted-foreground">No puedes borrar tu propio usuario.</p>
              ) : (
                <DeleteButton
                  endpoint={`/api/usuarios/${user.id}`}
                  entityLabel="usuario"
                  entityName={user.email}
                  redirectTo="/usuarios"
                />
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Editar usuario</CardTitle></CardHeader>
          <CardContent>
            <EditUserForm user={JSON.parse(JSON.stringify({
              id: user.id,
              name: user.name,
              email: user.email,
              active: user.active,
              roles: user.roles.map((r) => r.role.name),
            }))} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
