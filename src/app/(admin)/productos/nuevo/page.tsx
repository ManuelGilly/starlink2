"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NuevoProductoPage() {
  const router = useRouter();
  const [cats, setCats] = useState<any[]>([]);
  const [form, setForm] = useState({
    sku: "",
    name: "",
    categoryId: "",
    costPrice: "",
    salePrice: "",
    minStock: 0,
    warrantyDays: 0,
    description: "",
    features: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/categorias").then((r) => r.json()).then(setCats).catch(() => {});
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/productos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, categoryId: form.categoryId || null }),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error("Error al guardar");
      return;
    }
    toast.success("Producto creado");
    router.push("/productos");
    router.refresh();
  }

  return (
    <div className="p-6">
      <Card className="max-w-2xl">
        <CardHeader><CardTitle>Nuevo producto</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>SKU</Label><Input required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
              <div><Label>Nombre</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            </div>
            <div>
              <Label>Categoría</Label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              >
                <option value="">— sin categoría —</option>
                {cats.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Costo (USD)</Label><Input required type="number" step="0.01" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} /></div>
              <div><Label>Venta (USD)</Label><Input required type="number" step="0.01" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })} /></div>
              <div><Label>Stock mínimo</Label><Input type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })} /></div>
              <div><Label>Días de garantía</Label><Input type="number" value={form.warrantyDays} onChange={(e) => setForm({ ...form, warrantyDays: Number(e.target.value) })} /></div>
            </div>
            <div><Label>Descripción</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div><Label>Características principales</Label><Textarea value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} /></div>
            <Button disabled={loading}>{loading ? "Guardando…" : "Guardar"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
