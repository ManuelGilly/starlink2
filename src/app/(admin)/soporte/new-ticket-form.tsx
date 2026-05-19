"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Client = { id: string; firstName: string; lastName: string };

export function NewTicketForm({ clients, defaultClientId }: { clients: Client[]; defaultClientId?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    clientId: defaultClientId ?? (clients[0]?.id ?? ""),
    type: "TECNICO",
    priority: "MEDIA",
    title: "",
    description: "",
  });

  function set(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.clientId || !form.title || !form.description) {
      return toast.error("Cliente, título y descripción son requeridos");
    }
    setLoading(true);
    const res = await fetch("/api/soporte", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (!res.ok) return toast.error("No se pudo crear el ticket");
    toast.success("Ticket creado");
    setForm({ clientId: defaultClientId ?? (clients[0]?.id ?? ""), type: "TECNICO", priority: "MEDIA", title: "", description: "" });
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {!defaultClientId && (
          <div>
            <Label>Cliente *</Label>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.clientId}
              onChange={(e) => set("clientId", e.target.value)}
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <Label>Tipo</Label>
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={form.type}
            onChange={(e) => set("type", e.target.value)}
          >
            <option value="TECNICO">Técnico</option>
            <option value="FACTURACION">Facturación</option>
            <option value="CONSULTA">Consulta</option>
            <option value="OTRO">Otro</option>
          </select>
        </div>
        <div>
          <Label>Prioridad</Label>
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={form.priority}
            onChange={(e) => set("priority", e.target.value)}
          >
            <option value="BAJA">Baja</option>
            <option value="MEDIA">Media</option>
            <option value="ALTA">Alta</option>
            <option value="URGENTE">Urgente</option>
          </select>
        </div>
      </div>
      <div>
        <Label>Título *</Label>
        <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Ej: Antena sin conexión desde ayer" />
      </div>
      <div>
        <Label>Descripción *</Label>
        <Textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Detalla el problema..." />
      </div>
      <div className="flex justify-end">
        <Button disabled={loading}>{loading ? "Creando..." : "Abrir ticket"}</Button>
      </div>
    </form>
  );
}
