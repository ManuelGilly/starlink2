"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NuevoPlanPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    code: "",
    name: "",
    description: "",
    details: "",
    price: "",
    cost: "",
    billingCycle: "MONTHLY",
  });
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/planes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, cost: form.cost || null }),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error("Error al guardar");
      return;
    }
    toast.success("Plan creado");
    router.push("/planes");
    router.refresh();
  }

  return (
    <div className="p-6">
      <Card className="max-w-2xl">
        <CardHeader><CardTitle>Nuevo plan</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Código</Label><Input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
              <div><Label>Nombre</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Precio (USD)</Label><Input type="number" step="0.01" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
              <div><Label>Costo estimado (USD)</Label><Input type="number" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} /></div>
              <div>
                <Label>Ciclo de facturación</Label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={form.billingCycle}
                  onChange={(e) => setForm({ ...form, billingCycle: e.target.value })}
                >
                  <option value="MONTHLY">Mensual</option>
                  <option value="YEARLY">Anual</option>
                  <option value="ONE_TIME">Único</option>
                </select>
              </div>
            </div>
            <div><Label>Descripción</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div><Label>Detalle extendido</Label><Textarea value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} /></div>
            <Button disabled={loading}>{loading ? "Guardando…" : "Guardar"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
