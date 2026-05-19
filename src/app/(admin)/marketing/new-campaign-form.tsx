"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function todayLocal() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export function NewCampaignForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    startDate: todayLocal(),
    endDate: "",
    budget: "",
    messagesReceived: "0",
    status: "ACTIVA",
    platform: "Instagram",
    adUrl: "",
    notes: "",
  });

  function set(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.budget || !form.startDate) {
      return toast.error("Nombre, presupuesto y fecha de inicio son requeridos");
    }
    setLoading(true);
    const res = await fetch("/api/campanas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        description: form.description || null,
        startDate: new Date(form.startDate).toISOString(),
        endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
        budget: Number(form.budget),
        messagesReceived: Number(form.messagesReceived),
        status: form.status,
        platform: form.platform,
        adUrl: form.adUrl || null,
        notes: form.notes || null,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      return toast.error(d.error ?? "Error al crear campaña");
    }
    toast.success("Campaña creada");
    setForm({ name: "", description: "", startDate: todayLocal(), endDate: "", budget: "", messagesReceived: "0", status: "ACTIVA", platform: "Instagram", adUrl: "", notes: "" });
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <Label>Nombre del anuncio *</Label>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Ej: Lanzamiento Antenas Mayo 2026" />
        </div>
        <div>
          <Label>Plataforma</Label>
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={form.platform}
            onChange={(e) => set("platform", e.target.value)}
          >
            <option>Instagram</option>
            <option>Facebook</option>
            <option>TikTok</option>
            <option>Google</option>
            <option>Otro</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <Label>Fecha inicio *</Label>
          <Input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
        </div>
        <div>
          <Label>Fecha fin</Label>
          <Input type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} />
        </div>
        <div>
          <Label>Inversión (USD) *</Label>
          <Input type="number" step="0.01" min={0} value={form.budget} onChange={(e) => set("budget", e.target.value)} placeholder="0.00" />
        </div>
        <div>
          <Label>Mensajes recibidos</Label>
          <Input type="number" min={0} value={form.messagesReceived} onChange={(e) => set("messagesReceived", e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label>Estado</Label>
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={form.status}
            onChange={(e) => set("status", e.target.value)}
          >
            <option value="BORRADOR">Borrador</option>
            <option value="ACTIVA">Activa</option>
            <option value="PAUSADA">Pausada</option>
            <option value="FINALIZADA">Finalizada</option>
          </select>
        </div>
        <div>
          <Label>URL del anuncio (opcional)</Label>
          <Input value={form.adUrl} onChange={(e) => set("adUrl", e.target.value)} placeholder="https://instagram.com/..." />
        </div>
      </div>

      <div>
        <Label>Descripción / notas (opcional)</Label>
        <Textarea rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
      </div>

      <div className="flex justify-end">
        <Button disabled={loading}>{loading ? "Creando..." : "Crear campaña"}</Button>
      </div>
    </form>
  );
}
