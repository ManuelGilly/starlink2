"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function EditPlanForm({ plan }: { plan: any }) {
  const router = useRouter();
  const [form, setForm] = useState({
    code: plan.code,
    name: plan.name,
    description: plan.description ?? "",
    details: plan.details ?? "",
    price: String(plan.price),
    cost: plan.cost ? String(plan.cost) : "",
    billingCycle: plan.billingCycle,
    active: plan.active,
  });
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/planes/${plan.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, cost: form.cost || null }),
    });
    setLoading(false);
    if (!res.ok) return toast.error("Error al guardar");
    toast.success("Plan actualizado");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Código</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
        <div><Label>Nombre</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div><Label>Precio (USD)</Label><Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
        <div><Label>Costo (USD)</Label><Input type="number" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} /></div>
        <div>
          <Label>Ciclo</Label>
          <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.billingCycle} onChange={(e) => setForm({ ...form, billingCycle: e.target.value })}>
            <option value="MONTHLY">Mensual</option>
            <option value="YEARLY">Anual</option>
            <option value="ONE_TIME">Único</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
          <Label>Activo</Label>
        </div>
      </div>
      <div><Label>Descripción</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
      <div><Label>Detalle</Label><Textarea value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} /></div>
      <Button disabled={loading}>{loading ? "Guardando…" : "Guardar cambios"}</Button>
    </form>
  );
}
