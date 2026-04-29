"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function EditProductForm({ product }: { product: any }) {
  const router = useRouter();
  const [cats, setCats] = useState<any[]>([]);
  const [form, setForm] = useState({
    sku: product.sku,
    name: product.name,
    categoryId: product.categoryId ?? "",
    costPrice: String(product.costPrice),
    salePrice: String(product.salePrice),
    minStock: product.minStock,
    warrantyDays: product.warrantyDays,
    description: product.description ?? "",
    features: product.features ?? "",
    active: product.active,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/categorias").then((r) => r.json()).then(setCats).catch(() => {});
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/productos/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, categoryId: form.categoryId || null }),
    });
    setLoading(false);
    if (!res.ok) return toast.error("Error al guardar");
    toast.success("Producto actualizado. Cambios registrados en bitácora.");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>SKU</Label><Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
        <div><Label>Nombre</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
      </div>
      <div>
        <Label>Categoría</Label>
        <select
          className="h-10 w-full rounded-sm border border-border bg-input px-3 text-sm"
          value={form.categoryId}
          onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
        >
          <option value="">— sin categoría —</option>
          {cats.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Costo (USD)</Label><Input type="number" step="0.01" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} /></div>
        <div><Label>Venta (USD)</Label><Input type="number" step="0.01" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })} /></div>
        <div><Label>Stock mínimo</Label><Input type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })} /></div>
        <div><Label>Días de garantía</Label><Input type="number" value={form.warrantyDays} onChange={(e) => setForm({ ...form, warrantyDays: Number(e.target.value) })} /></div>
      </div>
      <div><Label>Descripción</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
      <div><Label>Características</Label><Textarea value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} /></div>
      <div className="flex items-center gap-2">
        <input id="active" type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
        <Label htmlFor="active">Activo</Label>
      </div>
      <Button disabled={loading}>{loading ? "Guardando…" : "Guardar cambios"}</Button>
    </form>
  );
}
