"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Client = { id: string; firstName: string; lastName: string };

const MODELS = [
  "Starlink Gen 3",
  "Starlink Mini",
  "Starlink RV",
  "Starlink Gen 2",
  "Starlink Flat High Performance",
  "Otro",
];

export function NewEquipmentForm({ clients }: { clients: Client[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    model: MODELS[0],
    serialNumber: "",
    condition: "NUEVO",
    clientId: "",
    purchaseDate: "",
    purchasePrice: "",
    notes: "",
  });

  function set(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.model) return toast.error("Modelo requerido");
    setLoading(true);
    const res = await fetch("/api/equipos", {
      method: "POST",
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
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      return toast.error(d.error ?? "Error al registrar");
    }
    toast.success("Equipo registrado");
    setForm({ model: MODELS[0], serialNumber: "", condition: "NUEVO", clientId: "", purchaseDate: "", purchasePrice: "", notes: "" });
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <Label>Modelo *</Label>
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={form.model}
            onChange={(e) => set("model", e.target.value)}
          >
            {MODELS.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <Label>Nº de serie</Label>
          <Input value={form.serialNumber} onChange={(e) => set("serialNumber", e.target.value)} placeholder="Ej: S/N 123456" />
        </div>
        <div>
          <Label>Estado</Label>
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={form.condition}
            onChange={(e) => set("condition", e.target.value)}
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
          <Label>Asignar a cliente (opcional)</Label>
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={form.clientId}
            onChange={(e) => set("clientId", e.target.value)}
          >
            <option value="">— Sin asignar —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
            ))}
          </select>
        </div>
        <div>
          <Label>Fecha de compra</Label>
          <Input type="date" value={form.purchaseDate} onChange={(e) => set("purchaseDate", e.target.value)} />
        </div>
        <div>
          <Label>Costo de adquisición (USD)</Label>
          <Input type="number" step="0.01" min={0} value={form.purchasePrice} onChange={(e) => set("purchasePrice", e.target.value)} placeholder="0.00" />
        </div>
      </div>

      <div>
        <Label>Notas</Label>
        <Textarea rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
      </div>

      <div className="flex justify-end">
        <Button disabled={loading}>{loading ? "Registrando..." : "Registrar equipo"}</Button>
      </div>
    </form>
  );
}
