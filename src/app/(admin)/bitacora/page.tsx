import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Topbar } from "@/components/layout/topbar";
import { formatDateTime } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BitacoraFilters } from "./filters";
import { DiffViewer } from "./diff-viewer";

export const dynamic = "force-dynamic";

const ACTIONS = ["CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT", "PASSWORD_RESET", "PASSWORD_CHANGE"];
const ENTITIES = ["Product", "ProductCategory", "Plan", "Client", "User", "Payment", "InventoryMovement", "Subscription", "Warranty"];

export default async function BitacoraPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const where: any = {};
  if (searchParams.entity) where.entity = searchParams.entity;
  if (searchParams.action) where.action = searchParams.action;
  if (searchParams.userId) where.userId = searchParams.userId;
  if (searchParams.from || searchParams.to) {
    where.createdAt = {};
    if (searchParams.from) where.createdAt.gte = new Date(searchParams.from);
    if (searchParams.to) where.createdAt.lte = new Date(searchParams.to);
  }

  const [logs, users, stats] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.user.findMany({ select: { id: true, name: true, email: true }, orderBy: { name: "asc" } }),
    prisma.auditLog.groupBy({ by: ["action"], _count: true }),
  ]);

  const statCount = (a: string) => stats.find((s) => s.action === a)?._count ?? 0;

  return (
    <>
      <Topbar title="Bitácora" eyebrow="Sistema" />
      <div className="space-y-6 p-8">
        {/* Stat row */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
          {[
            { label: "Total", value: logs.length },
            { label: "Creaciones", value: statCount("CREATE") },
            { label: "Ediciones", value: statCount("UPDATE") },
            { label: "Borrados", value: statCount("DELETE") },
            { label: "Logins", value: statCount("LOGIN") },
            { label: "Reset password", value: statCount("PASSWORD_RESET") },
            { label: "Cambio password", value: statCount("PASSWORD_CHANGE") },
          ].map((s) => (
            <div key={s.label} className="rounded-sm border border-border bg-card p-4">
              <div className="eyebrow">{s.label}</div>
              <div className="stat-value mt-2">{s.value}</div>
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <BitacoraFilters
              actions={ACTIONS}
              entities={ENTITIES}
              users={users}
              initial={searchParams}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Registros ({logs.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead>Entidad</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Cambios</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{formatDateTime(l.createdAt)}</TableCell>
                    <TableCell className="text-[12px]">
                      {l.user ? (
                        <>
                          <div className="font-medium">{l.user.name}</div>
                          <div className="text-[11px] text-muted-foreground">{l.user.email}</div>
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        l.action === "DELETE" ? "destructive" :
                        l.action === "CREATE" ? "success" :
                        l.action === "UPDATE" ? "default" :
                        "outline"
                      }>{l.action}</Badge>
                    </TableCell>
                    <TableCell className="text-[12px]">{l.entity}</TableCell>
                    <TableCell className="font-mono text-[10px] text-muted-foreground">{l.entityId ? l.entityId.slice(-8) : "—"}</TableCell>
                    <TableCell className="max-w-[420px]">
                      <DiffViewer diff={l.diff as any} />
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-muted-foreground">{l.ipAddress ?? "—"}</TableCell>
                  </TableRow>
                ))}
                {logs.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">Sin registros</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
