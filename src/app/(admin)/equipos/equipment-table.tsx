"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatUSD } from "@/lib/utils";

type Client = { id: string; firstName: string; lastName: string };
type Equipment = {
  id: string;
  model: string;
  serialNumber: string | null;
  condition: string;
  clientId: string | null;
  client: Client | null;
  purchaseDate: string | null;
  purchasePrice: string | number | null;
  notes: string | null;
};

const MODELS = [
  "Starlink Gen 3",
  "Starlink Mini",
  "Starlink RV",
  "Starlink Gen 2",
  "Starlink Flat High Performance",
  "Otro",
];

const CONDITION_LABEL: Record<string, string> = {
  NUEVO: "Nuevo",
  USADO: "Usado",
  DANADO: "Dañado",
  DADO_DE_BAJA: "Dado de baja",
};
const CONDITION_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  NUEVO: "default",
  USADO: "secondary",
  DANADO: "destructive",
  DADO_DE_BAJA: "outline",
};

type EditForm = {
  model: string;
  serialNumber: string;
  condition: string;
  clientId: string;
  purchaseDate: string;
  purchasePrice: string;
  notes: string;
};

function toForm(e: Equipment): EditForm {
  return {
    model: e.model,
    serialNumber: e.serialNumber ?? "",
    condition: e.condition,
    clientId: e.clientId ?? "",
    purchaseDate: e.purchaseDate ? e.purchaseDate.slice(0, 10) : "",
    purchasePrice: e.purchasePrice != null ? String(e.purchasePrice) : "",
    notes: e.notes ?? "",
  };
}

export function EquipmentTable({ equipment, clients }: { equipment: Equipment[]; clients: Client[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  function startEdit(e: Equipment) {
    setEditingId(e.id);
    setForm(toForm(e));
  }
  function cancel() {
    setEditingId(null);
    setForm(null);
  }
  function set(key: keyof EditForm, value: string) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function save(id: string) {
    if (!form) return;
    if (!form.model) return toast.error("Modelo requerido");
    setBusyId(id);
    const res = await fetch(`/api/equipos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: form.model,
        serialNumber: form.serialNumber || null,
        condition: form.condition,
        clientId: form.clientId || null,
        purchaseDate: form.purchaseDate ? new Date(form.purchaseDate).toISOString() : null,
        purchasePrice: form.purchasePrice ? Number(form.purchasePrice) : null,
        notes: form.notes || null,
      }),
    });
    setBusyId(null);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      return toast.error(typeof d.error === "string" ? d.error : "Error al guardar");
    }
    toast.success("Equipo actualizado");
    cancel();
    router.refresh();
  }

  async function remove(e: Equipment) {
    const label = `${e.model}${e.serialNumber ? ` · ${e.serialNumber}` : ""}`;
    if (!confirm(`¿Borrar el equipo "${label}"? Esta acción no se puede deshacer.`)) return;
    setBusyId(e.id);
    const res = await fetch(`/api/equipos/${e.id}`, { method: "DELETE" });
    setBusyId(null);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      return toast.error(typeof d.error === "string" ? d.error : "Error al borrar");
    }
    toast.success("Equipo borrado");
    if (editingId === e.id) cancel();
    router.refresh();
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Modelo</TableHead>
          <TableHead>Nº Serie</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Cliente asignado</TableHead>
          <TableHead>Compra</TableHead>
          <TableHead>Costo</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {equipment.map((e) => {
          const isEditing = editingId === e.id;
          const busy = busyId === e.id;
          return (
            <Fragment key={e.id}>
              <TableRow>
                <TableCell className="font-medium">{e.model}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{e.serialNumber ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={CONDITION_VARIANT[e.condition] ?? "outline"}>
                    {CONDITION_LABEL[e.condition] ?? e.condition}
                  </Badge>
                </TableCell>
                <TableCell>
                  {e.client ? (
                    <Link href={`/clientes/${e.client.id}`} className="hover:underline text-sm">
                      {e.client.firstName} {e.client.lastName}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground text-sm">Sin asignar</span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {e.purchaseDate ? formatDate(e.purchaseDate) : "—"}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {e.purchasePrice != null ? formatUSD(Number(e.purchasePrice)) : "—"}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <Button variant="ghost" size="sm" onClick={() => (isEditing ? cancel() : startEdit(e))} disabled={busy}>
                    {isEditing ? "Cerrar" : "Editar"}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => remove(e)} disabled={busy}>
                    Borrar
                  </Button>
                </TableCell>
              </TableRow>

              {isEditing && form && (
                <TableRow key={`${e.id}-edit`} className="bg-muted/30 hover:bg-muted/30">
                  <TableCell colSpan={7} className="p-4">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div>
                          <Label>Modelo *</Label>
                          <select
                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                            value={form.model}
                            onChange={(ev) => set("model", ev.target.value)}
                          >
                            {(MODELS.includes(form.model) ? MODELS : [form.model, ...MODELS]).map((m) => (
                              <option key={m}>{m}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label>Nº de serie</Label>
                          <Input value={form.serialNumber} onChange={(ev) => set("serialNumber", ev.target.value)} placeholder="Ej: S/N 123456" />
                        </div>
                        <div>
                          <Label>Estado</Label>
                          <select
                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                            value={form.condition}
                            onChange={(ev) => set("condition", ev.target.value)}
                          >
                            <option value="NUEVO">Nuevo</option>
                            <option value="USADO">Usado</option>
                            <option value="DANADO">Dañado</option>
                            <option value="DADO_DE_BAJA">Dado de baja</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div>
                          <Label>Asignar a cliente</Label>
                          <select
                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                            value={form.clientId}
                            onChange={(ev) => set("clientId", ev.target.value)}
                          >
                            <option value="">— Sin asignar —</option>
                            {clients.map((c) => (
                              <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label>Fecha de compra</Label>
                          <Input type="date" value={form.purchaseDate} onChange={(ev) => set("purchaseDate", ev.target.value)} />
                        </div>
                        <div>
                          <Label>Costo de adquisición (USD)</Label>
                          <Input type="number" step="0.01" min={0} value={form.purchasePrice} onChange={(ev) => set("purchasePrice", ev.target.value)} placeholder="0.00" />
                        </div>
                      </div>

                      <div>
                        <Label>Notas</Label>
                        <Textarea rows={2} value={form.notes} onChange={(ev) => set("notes", ev.target.value)} />
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={cancel} disabled={busy}>Cancelar</Button>
                        <Button size="sm" onClick={() => save(e.id)} disabled={busy}>{busy ? "Guardando..." : "Guardar cambios"}</Button>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </Fragment>
          );
        })}
        {equipment.length === 0 && (
          <TableRow>
            <TableCell colSpan={7} className="text-center text-muted-foreground">
              Sin equipos registrados
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
