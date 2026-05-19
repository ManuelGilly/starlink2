import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Topbar } from "@/components/layout/topbar";
import { formatDateTime } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChannelToggle } from "./toggle";

export const dynamic = "force-dynamic";

const CHANNEL_SETUP: Record<string, { provider: string; vars: string[]; url: string }> = {
  EMAIL: {
    provider: "Resend (recomendado)",
    vars: ["RESEND_API_KEY", "RESEND_FROM"],
    url: "https://resend.com — gratis hasta 3 000 emails/mes",
  },
  WHATSAPP: {
    provider: "UltraMsg (recomendado) o Meta Cloud API",
    vars: ["ULTRAMSG_INSTANCE_ID", "ULTRAMSG_TOKEN"],
    url: "https://ultramsg.com — ~$15/mes, sin verificación de negocio",
  },
  TELEGRAM: {
    provider: "Telegram Bot API",
    vars: ["TELEGRAM_BOT_TOKEN"],
    url: "Ya configurado — crea un bot con @BotFather",
  },
  SMS: {
    provider: "—",
    vars: [],
    url: "No implementado aún",
  },
  INSTAGRAM: {
    provider: "—",
    vars: [],
    url: "No implementado aún",
  },
};

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

        {/* Guía de configuración */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader><CardTitle className="text-sm">Configuración de canales</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground text-xs">
              Para activar un canal, añade las variables de entorno en <strong>Vercel → Settings → Environment Variables</strong>, luego haz redeploy.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {Object.entries(CHANNEL_SETUP).filter(([, c]) => c.vars.length > 0).map(([type, cfg]) => (
                <div key={type} className="rounded-md border border-border bg-background p-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs uppercase tracking-wide">{type}</span>
                    <span className="text-xs text-muted-foreground">· {cfg.provider}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {cfg.vars.map((v) => (
                      <code key={v} className="rounded bg-muted px-1 py-0.5 text-[11px]">{v}</code>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground">{cfg.url}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Estado de canales</CardTitle></CardHeader>
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
                    <TableCell className="font-medium">{c.type}</TableCell>
                    <TableCell>
                      <Badge variant={c.enabled ? "default" : "outline"}>
                        {c.enabled ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell><ChannelToggle type={c.type} enabled={c.enabled} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Plantillas ({templates.length})</CardTitle></CardHeader>
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
                    <TableCell className="text-xs">{formatDateTime(l.createdAt)}</TableCell>
                    <TableCell>{l.channel}</TableCell>
                    <TableCell className="text-xs">{l.recipient}</TableCell>
                    <TableCell className="max-w-[180px] truncate text-xs">{l.subject ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={l.status === "ENVIADO" ? "default" : l.status === "FALLIDO" ? "destructive" : "secondary"}>
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
