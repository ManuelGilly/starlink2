import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatUSD, formatDate } from "@/lib/utils";
import { Topbar } from "@/components/layout/topbar";
import { AssignPlanForm } from "./assign-plan";
import { EditClientForm } from "./edit-form";
import { RegisterSaleForm } from "./sale-form";
import { DeleteButton } from "@/components/delete-button";
import { ClientTimeline } from "./client-timeline";
import { NewTicketForm } from "../../../(admin)/soporte/new-ticket-form";
import { TicketActions } from "../../../(admin)/soporte/ticket-actions";
import { getCurrentUser } from "@/lib/rbac";

export const dynamic = "force-dynamic";

// Secciones ocultas de la ficha de cliente (poner en true para reactivarlas).
const SHOW_TICKETS_SECTION = false;
const SHOW_CRM_SECTION = false;

const CONDITION_LABEL: Record<string, string> = { NUEVO: "Nuevo", USADO: "Usado", DANADO: "Dañado", DADO_DE_BAJA: "Baja" };
const STATUS_TICKET: Record<string, string> = { ABIERTO: "Abierto", EN_PROCESO: "En proceso", RESUELTO: "Resuelto", CERRADO: "Cerrado" };
const PRIORITY_TICKET: Record<string, string> = { BAJA: "Baja", MEDIA: "Media", ALTA: "Alta", URGENTE: "Urgente" };

export default async function ClienteDetalle({ params }: { params: { id: string } }) {
  const [client, plans, products, user, campaigns, equipment, tickets, notes] = await Promise.all([
    prisma.client.findUnique({
      where: { id: params.id },
      include: {
        subscriptions: { include: { plan: true } },
        payments: { orderBy: { createdAt: "desc" }, take: 30 },
        warranties: { include: { product: true } },
        sales: { include: { items: { include: { product: true } } }, orderBy: { createdAt: "desc" } },
      },
    }),
    prisma.plan.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.product.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    getCurrentUser(),
    prisma.adCampaign.findMany({ where: { status: { in: ["ACTIVA", "PAUSADA"] } }, orderBy: { startDate: "desc" } }),
    prisma.equipment.findMany({ where: { clientId: params.id, active: true } }),
    prisma.supportTicket.findMany({ where: { clientId: params.id }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.clientNote.findMany({ where: { clientId: params.id }, orderBy: { createdAt: "desc" }, take: 30 }),
  ]);
  if (!client) notFound();
  const isAdmin = user?.roles.includes("ADMIN");

  return (
    <>
      <Topbar title={`Cliente: ${client.firstName} ${client.lastName}`} />
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Datos de contacto</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              <div><strong>Email:</strong> {client.email}</div>
              <div><strong>Teléfono:</strong> {client.phone}</div>
              <div><strong>Dirección:</strong> {client.address ?? "—"}</div>
              <div><strong>Telegram:</strong> {client.telegramChatId ?? "—"}</div>
              {client.notes && <div className="col-span-2"><strong>Notas:</strong> {client.notes}</div>}
            </CardContent>
          </Card>
          {isAdmin && (
            <Card>
              <CardHeader><CardTitle>Zona administrativa</CardTitle></CardHeader>
              <CardContent>
                <DeleteButton
                  endpoint={`/api/clientes/${client.id}`}
                  entityLabel="cliente"
                  entityName={`${client.firstName} ${client.lastName}`}
                  redirectTo="/clientes"
                  confirmWord={client.lastName.toUpperCase()}
                />
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Borrar un cliente elimina sus suscripciones, pagos, garantías y ventas en cascada.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader><CardTitle>Editar datos</CardTitle></CardHeader>
          <CardContent>
            <EditClientForm client={JSON.parse(JSON.stringify(client))} />
          </CardContent>
        </Card>

        {/* Equipos asignados */}
        <Card>
          <CardHeader>
            <CardTitle>Equipos / Antenas ({equipment.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {equipment.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Nº Serie</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Compra</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {equipment.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.model}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{e.serialNumber ?? "—"}</TableCell>
                      <TableCell><Badge variant="outline">{CONDITION_LABEL[e.condition] ?? e.condition}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{e.purchaseDate ? formatDate(e.purchaseDate) : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">Sin equipos asignados. Regístralos en <a href="/equipos" className="underline">Equipos</a>.</p>
            )}
          </CardContent>
        </Card>

        {/* Suscripciones */}
        <Card>
          <CardHeader><CardTitle>Suscripciones</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Inicio</TableHead>
                  <TableHead>Día corte</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {client.subscriptions.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.plan.name}</TableCell>
                    <TableCell>{formatUSD(Number(s.priceLocked))}</TableCell>
                    <TableCell>{formatDate(s.startDate)}</TableCell>
                    <TableCell>{s.billingDay}</TableCell>
                    <TableCell><Badge>{s.status}</Badge></TableCell>
                  </TableRow>
                ))}
                {client.subscriptions.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Sin suscripciones</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
            <div className="mt-4">
              <AssignPlanForm clientId={client.id} plans={JSON.parse(JSON.stringify(plans))} campaigns={JSON.parse(JSON.stringify(campaigns))} />
            </div>
          </CardContent>
        </Card>

        {/* Tickets de soporte — oculto (SHOW_TICKETS_SECTION) */}
        {SHOW_TICKETS_SECTION && (
        <Card>
          <CardHeader><CardTitle>Tickets de soporte ({tickets.filter((t) => t.status !== "CERRADO").length} activos)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {tickets.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Prioridad</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((t) => (
                    <TableRow key={t.id} className={t.status === "CERRADO" ? "opacity-50" : ""}>
                      <TableCell className="text-xs">{formatDate(t.createdAt)}</TableCell>
                      <TableCell className="text-sm font-medium">{t.title}</TableCell>
                      <TableCell><Badge variant="outline">{PRIORITY_TICKET[t.priority] ?? t.priority}</Badge></TableCell>
                      <TableCell><Badge>{STATUS_TICKET[t.status] ?? t.status}</Badge></TableCell>
                      <TableCell><TicketActions ticket={JSON.parse(JSON.stringify(t))} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <div>
              <p className="mb-2 text-sm font-medium text-muted-foreground">Nuevo ticket</p>
              <NewTicketForm clients={[]} defaultClientId={client.id} />
            </div>
          </CardContent>
        </Card>
        )}

        {/* Timeline / Notas CRM — oculto (SHOW_CRM_SECTION) */}
        {SHOW_CRM_SECTION && (
        <Card>
          <CardHeader><CardTitle>Notas e historial CRM</CardTitle></CardHeader>
          <CardContent>
            <ClientTimeline
              clientId={client.id}
              notes={JSON.parse(JSON.stringify(notes))}
            />
          </CardContent>
        </Card>
        )}

        {/* Historial de pagos */}
        <Card>
          <CardHeader><CardTitle>Historial de pagos</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Referencia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {client.payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{formatDate(p.createdAt)}</TableCell>
                    <TableCell>{formatUSD(Number(p.amount))}</TableCell>
                    <TableCell>{p.method}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === "CONFIRMADO" ? "default" : p.status === "RECHAZADO" ? "destructive" : "secondary"}>
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{p.reference ?? "—"}</TableCell>
                  </TableRow>
                ))}
                {client.payments.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Sin pagos</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Garantías */}
        <Card>
          <CardHeader><CardTitle>Garantías</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Serie</TableHead>
                  <TableHead>Inicio</TableHead>
                  <TableHead>Fin</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {client.warranties.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell>{w.product.name}</TableCell>
                    <TableCell>{w.serialNumber ?? "—"}</TableCell>
                    <TableCell>{formatDate(w.startsAt)}</TableCell>
                    <TableCell>{formatDate(w.endsAt)}</TableCell>
                    <TableCell><Badge>{w.status}</Badge></TableCell>
                  </TableRow>
                ))}
                {client.warranties.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Sin garantías</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Compras */}
        <Card>
          <CardHeader><CardTitle>Compras de productos</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Productos</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Notas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {client.sales.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{formatDate(s.createdAt)}</TableCell>
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
                {client.sales.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Sin compras registradas</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
            <div>
              <h3 className="mb-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">Registrar compra</h3>
              <RegisterSaleForm clientId={client.id} products={JSON.parse(JSON.stringify(products))} />
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
