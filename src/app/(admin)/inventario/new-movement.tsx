"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const TYPES = ["ENTRADA", "SALIDA", "AJUSTE", "MERMA", "DEVOLUCION"] as const;

export function NewMovementForm({ products }: { products: any[] }) {
  const router = useRouter();
  const [form, setForm] = useState({
    productId: products[0]?.id ?? "",
    type: "ENTRADA" as (typeof TYPES)[number],
    quantity: 1,
    unitCost: "",
    reference: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/inventario/movimientos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, unitCost: form.unitCost || null }),
    });
    setLoading(false);
    if (!res.ok) return toast.error("Error al registrar");
    toast.success("Movimiento registrado");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-6 items-end gap-3">
      <div className="col-span-2">
        <Label>Producto</Label>
        <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}>
          {products.map((p) => (<option key={p.id} value={p.id}>{p.name} ({p.sku})</option>))}
        </select>
      </div>
      <div>
        <Label>Tipo</Label>
        <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })}>
          {TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}
        </select>
      </div>
      <div>
        <Label>Cantidad</Label>
        <Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
      </div>
      <div>
        <Label>Costo unit. (USD)</Label>
        <Input type="number" step="0.01" value={form.unitCost} onChange={(e) => setForm({ ...form, unitCost: e.target.value })} />
      </div>
      <div>
        <Label>Referencia</Label>
        <Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
      </div>
      <div className="col-span-5">
        <Label>Notas</Label>
        <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </div>
      <Button disabled={loading}>{loading ? "…" : "Registrar"}</Button>
    </form>
  );
}
