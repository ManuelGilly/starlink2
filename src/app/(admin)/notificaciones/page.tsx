import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Topbar } from "@/components/layout/topbar";
import { formatDateTime } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChannelToggle } from "./toggle";

export const dynamic = "force-dynamic";

export default async function NotificacionesPage() {
  const [channels, templates, logs] = await Promise.all([
    prisma.notificationChannel.findMany({ orderBy: { type: "asc" } }),
    prisma.notificationTemplate.findMany({ orderBy: { code: "asc" } }),
    prisma.notificationLog.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
  ]);

  return (
    <>
      <Topbar title="Notificaciones" />
      <div className="p-6 space-y-4">
        <Card>
          <CardHeader><CardTitle>Canales</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Canal</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {channels.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.type}</TableCell>
                    <TableCell><Badge variant={c.enabled ? "success" : "outline"}>{c.enabled ? "Activo" : "Inactivo"}</Badge></TableCell>
                    <TableCell><ChannelToggle type={c.type} enabled={c.enabled} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="pt-4 text-xs text-muted-foreground">
              Las credenciales de cada canal se configuran en el archivo <code>.env</code>. Al activar un canal, el
              sistema usará el proveedor real; si no hay credenciales, los mensajes se loguean como stub.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Plantillas</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Asunto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs">{t.code}</TableCell>
                    <TableCell>{t.name}</TableCell>
                    <TableCell>{t.channelType ?? "—"}</TableCell>
                    <TableCell>{t.subject ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Log (últimos 30)</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Destinatario</TableHead>
                  <TableHead>Asunto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>{formatDateTime(l.createdAt)}</TableCell>
                    <TableCell>{l.channel}</TableCell>
                    <TableCell>{l.recipient}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{l.subject ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={l.status === "ENVIADO" ? "success" : l.status === "FALLIDO" ? "destructive" : "secondary"}>
                        {l.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">{l.error ?? "—"}</TableCell>
                  </TableRow>
                ))}
                {logs.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Sin envíos aún</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
