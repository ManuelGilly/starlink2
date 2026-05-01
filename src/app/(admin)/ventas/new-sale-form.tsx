"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Client = { id: string; firstName: string; lastName: string; documentId: string | null };
type Product = { id: string; sku: string; name: string; salePrice: number | string; warrantyDays: number };
type Item = { productId: string; quantity: number; unitPrice: string };

function todayLocal(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 10);
}

export function NewSaleForm({ clients, products }: { clients: Client[]; products: Product[] }) {
  const router = useRouter();
  const firstProduct = products[0];
  const [clientId, setClientId] = useState<string>(clients[0]?.id ?? "");
  const [items, setItems] = useState<Item[]>(
    firstProduct
      ? [{ productId: firstProduct.id, quantity: 1, unitPrice: String(Number(firstProduct.salePrice)) }]
      : [],
  );
  const [occurredAt, setOccurredAt] = useState<string>(todayLocal());
  const [notes, setNotes] = useState("");
  const [createWarranties, setCreateWarranties] = useState(true);
  const [loading, setLoading] = useState(false);

  const total = useMemo(
    () => items.reduce((acc, it) => acc + (Number(it.unitPrice) || 0) * (Number(it.quantity) || 0), 0),
    [items],
  );

  function setItem(idx: number, patch: Partial<Item>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  function onProductChange(idx: number, productId: string) {
    const p = products.find((pp) => pp.id === productId);
    setItem(idx, { productId, unitPrice: p ? String(Number(p.salePrice)) : "" });
  }

  function addItem() {
    if (!firstProduct) return;
    setItems((prev) => [...prev, { productId: firstProduct.id, quantity: 1, unitPrice: String(Number(firstProduct.salePrice)) }]);
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId) return toast.error("Selecciona un cliente");
    if (items.length === 0) return toast.error("Agrega al menos un producto");
    setLoading(true);
    const res = await fetch(`/api/ventas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        items: items.map((it) => ({
          productId: it.productId,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
        })),
        occurredAt: occurredAt ? new Date(occurredAt).toISOString() : undefined,
        notes: notes || undefined,
        createWarranties,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return toast.error(data.error?.toString?.() ?? "No se pudo registrar la venta");
    }
    toast.success("Venta registrada");
    setItems(firstProduct ? [{ productId: firstProduct.id, quantity: 1, unitPrice: String(Number(firstProduct.salePrice)) }] : []);
    setNotes("");
    setOccurredAt(todayLocal());
    router.refresh();
  }

  if (clients.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay clientes registrados.</p>;
  }
  if (products.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay productos activos.</p>;
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <Label>Cliente</Label>
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.firstName} {c.lastName}{c.documentId ? ` — ${c.documentId}` : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Fecha</Label>
          <Input type="date" value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} />
        </div>
      </div>

      <div className="rounded-md border border-border bg-muted/20">
        <div className="grid grid-cols-12 gap-2 border-b border-border bg-muted/30 px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          <div className="col-span-5">Producto</div>
          <div className="col-span-2 text-right">Cantidad</div>
          <div className="col-span-2 text-right">Precio USD</div>
          <div className="col-span-2 text-right">Subtotal</div>
          <div className="col-span-1" />
        </div>
        <div className="divide-y divide-border">
          {items.map((it, idx) => (
            <div key={idx} className="grid grid-cols-12 items-center gap-2 px-3 py-2">
              <div className="col-span-5">
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                  value={it.productId}
                  onChange={(e) => onProductChange(idx, e.target.value)}
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <Input className="h-9 text-right" type="number" min={1} value={it.quantity} onChange={(e) => setItem(idx, { quantity: Number(e.target.value) })} />
              </div>
              <div className="col-span-2">
                <Input className="h-9 text-right font-mono" type="number" step="0.01" min={0} value={it.unitPrice} onChange={(e) => setItem(idx, { unitPrice: e.target.value })} />
              </div>
              <div className="col-span-2 text-right font-mono text-sm">
                ${((Number(it.unitPrice) || 0) * (Number(it.quantity) || 0)).toFixed(2)}
              </div>
              <div className="col-span-1 flex justify-end">
                <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => removeItem(idx)} disabled={items.length === 1}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-border px-3 py-2">
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Agregar producto
          </Button>
          <div className="text-right">
            <span className="mr-2 text-[10px] uppercase tracking-wide text-muted-foreground">Total</span>
            <span className="font-mono text-base font-medium">${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div>
        <Label>Notas (opcional)</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" checked={createWarranties} onChange={(e) => setCreateWarranties(e.target.checked)} />
          Crear garantías automáticamente
        </label>
        <Button disabled={loading || items.length === 0 || !clientId}>{loading ? "Registrando..." : "Registrar venta"}</Button>
      </div>
    </form>
  );
}
