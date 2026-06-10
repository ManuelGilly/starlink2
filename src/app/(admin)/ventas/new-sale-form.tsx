"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import {
  PaymentSplitsEditor,
  emptySplit,
  splitsTotalUSD,
  toSplitPayload,
  type SplitRow,
} from "@/components/payments/payment-splits-editor";

type Client = { id: string; firstName: string; lastName: string };
type Product = { id: string; sku: string; name: string; salePrice: number | string; costPrice: number | string; warrantyDays: number; serialized: boolean };
type Campaign = { id: string; name: string };
type Unit = { id: string; serialNumber: string | null; landedCost: number | string | null };
type Item = { productId: string; quantity: number; unitPrice: string; unitId: string };

function todayLocal(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

export function NewSaleForm({ clients, products, campaigns = [], rate = 0 }: { clients: Client[]; products: Product[]; campaigns?: Campaign[]; rate?: number }) {
  const router = useRouter();
  const firstProduct = products[0];
  const [clientId, setClientId] = useState<string>(clients[0]?.id ?? "");
  const [items, setItems] = useState<Item[]>(
    firstProduct ? [{ productId: firstProduct.id, quantity: 1, unitPrice: String(Number(firstProduct.salePrice)), unitId: "" }] : [],
  );
  const [occurredAt, setOccurredAt] = useState<string>(todayLocal());
  const [notes, setNotes] = useState("");
  const [origin, setOrigin] = useState("ORGANICO");
  const [campaignId, setCampaignId] = useState("");
  const [createWarranties, setCreateWarranties] = useState(true);
  const [loading, setLoading] = useState(false);

  // Unidades disponibles por producto serializado (carga perezosa).
  const [unitsByProduct, setUnitsByProduct] = useState<Record<string, Unit[]>>({});

  // Pago
  const [registrarPago, setRegistrarPago] = useState(true);
  const [splits, setSplits] = useState<SplitRow[]>([emptySplit(rate)]);

  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  async function loadUnits(productId: string) {
    if (unitsByProduct[productId]) return;
    try {
      const res = await fetch(`/api/equipos?available=true&productId=${productId}`);
      const data = await res.json();
      setUnitsByProduct((prev) => ({ ...prev, [productId]: Array.isArray(data) ? data : [] }));
    } catch {
      setUnitsByProduct((prev) => ({ ...prev, [productId]: [] }));
    }
  }

  useEffect(() => {
    // Precargar unidades para productos serializados ya presentes en líneas.
    for (const it of items) {
      const p = productById.get(it.productId);
      if (p?.serialized) loadUnits(it.productId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function lineCost(it: Item): number {
    const p = productById.get(it.productId);
    if (!p) return 0;
    if (p.serialized) {
      const u = (unitsByProduct[it.productId] ?? []).find((x) => x.id === it.unitId);
      return u?.landedCost != null ? Number(u.landedCost) : Number(p.costPrice);
    }
    return Number(p.costPrice);
  }

  const total = useMemo(() => items.reduce((acc, it) => acc + (Number(it.unitPrice) || 0) * (Number(it.quantity) || 0), 0), [items]);
  const totalCost = useMemo(
    () => items.reduce((acc, it) => acc + lineCost(it) * (Number(it.quantity) || 0), 0),
    [items, unitsByProduct],
  );
  const ganancia = total - totalCost;

  function setItem(idx: number, patch: Partial<Item>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  function onProductChange(idx: number, productId: string) {
    const p = productById.get(productId);
    setItem(idx, { productId, unitPrice: p ? String(Number(p.salePrice)) : "", unitId: "", quantity: 1 });
    if (p?.serialized) loadUnits(productId);
  }

  function addItem() {
    if (!firstProduct) return;
    setItems((prev) => [...prev, { productId: firstProduct.id, quantity: 1, unitPrice: String(Number(firstProduct.salePrice)), unitId: "" }]);
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId) return toast.error("Selecciona un cliente");
    if (items.length === 0) return toast.error("Agrega al menos un producto");
    for (const it of items) {
      const p = productById.get(it.productId);
      if (p?.serialized && !it.unitId) return toast.error(`Selecciona la unidad (serial) de "${p.name}"`);
    }
    if (registrarPago && splitsTotalUSD(splits) <= 0) return toast.error("Indica el pago o desactiva 'Registrar pago'");

    setLoading(true);
    const res = await fetch(`/api/ventas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        items: items.map((it) => {
          const p = productById.get(it.productId);
          return {
            productId: it.productId,
            quantity: p?.serialized ? 1 : Number(it.quantity),
            unitPrice: Number(it.unitPrice),
            unitId: p?.serialized ? it.unitId : undefined,
          };
        }),
        occurredAt: occurredAt ? new Date(occurredAt).toISOString() : undefined,
        notes: notes || undefined,
        createWarranties,
        origin,
        campaignId: campaignId || undefined,
        splits: registrarPago ? toSplitPayload(splits) : undefined,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return toast.error(typeof data.error === "string" ? data.error : "No se pudo registrar la venta");
    }
    toast.success("Venta registrada");
    setItems(firstProduct ? [{ productId: firstProduct.id, quantity: 1, unitPrice: String(Number(firstProduct.salePrice)), unitId: "" }] : []);
    setNotes("");
    setOccurredAt(todayLocal());
    setOrigin("ORGANICO");
    setCampaignId("");
    setSplits([emptySplit(rate)]);
    // Invalidar cache de unidades (las vendidas ya no están disponibles).
    setUnitsByProduct({});
    router.refresh();
  }

  if (clients.length === 0) return <p className="text-sm text-muted-foreground">No hay clientes registrados.</p>;
  if (products.length === 0) return <p className="text-sm text-muted-foreground">No hay productos activos.</p>;

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <Label>Cliente</Label>
          <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={clientId} onChange={(e) => setClientId(e.target.value)}>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
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
          <div className="col-span-5">Producto / Unidad</div>
          <div className="col-span-2 text-right">Cantidad</div>
          <div className="col-span-2 text-right">Precio USD</div>
          <div className="col-span-2 text-right">Subtotal</div>
          <div className="col-span-1" />
        </div>
        <div className="divide-y divide-border">
          {items.map((it, idx) => {
            const p = productById.get(it.productId);
            const units = unitsByProduct[it.productId] ?? [];
            return (
              <div key={idx} className="grid grid-cols-12 items-start gap-2 px-3 py-2">
                <div className="col-span-5 space-y-1">
                  <select className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" value={it.productId} onChange={(e) => onProductChange(idx, e.target.value)}>
                    {products.map((pp) => (
                      <option key={pp.id} value={pp.id}>{pp.name}{pp.serialized ? " ·serial" : ""}</option>
                    ))}
                  </select>
                  {p?.serialized && (
                    <select className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" value={it.unitId} onChange={(e) => setItem(idx, { unitId: e.target.value })}>
                      <option value="">— elegir unidad —</option>
                      {units.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.serialNumber ?? u.id.slice(0, 8)} · costo ${Number(u.landedCost ?? 0).toFixed(2)}
                        </option>
                      ))}
                    </select>
                  )}
                  {p?.serialized && units.length === 0 && (
                    <p className="text-[11px] text-amber-500">Sin unidades disponibles. Registra un lote en Compras.</p>
                  )}
                </div>
                <div className="col-span-2">
                  <Input className="h-9 text-right" type="number" min={1} value={it.quantity} disabled={p?.serialized} onChange={(e) => setItem(idx, { quantity: Number(e.target.value) })} />
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
            );
          })}
        </div>
        <div className="flex items-center justify-between border-t border-border px-3 py-2">
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Agregar producto
          </Button>
          <div className="flex items-center gap-4 text-right">
            <span className="text-xs text-muted-foreground">Costo <span className="font-mono">${totalCost.toFixed(2)}</span></span>
            <span className={`text-xs ${ganancia >= 0 ? "text-green-500" : "text-destructive"}`}>Ganancia <span className="font-mono">${ganancia.toFixed(2)}</span></span>
            <span><span className="mr-2 text-[10px] uppercase tracking-wide text-muted-foreground">Total</span><span className="font-mono text-base font-medium">${total.toFixed(2)}</span></span>
          </div>
        </div>
      </div>

      {/* Pago */}
      <div className="rounded-md border border-border p-3">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={registrarPago} onChange={(e) => setRegistrarPago(e.target.checked)} />
          Registrar pago ahora
        </label>
        {registrarPago && (
          <div className="mt-3">
            <PaymentSplitsEditor splits={splits} onChange={setSplits} rate={rate} targetUSD={total} />
          </div>
        )}
      </div>

      {/* Opciones secundarias plegadas para aligerar el flujo principal */}
      <CollapsibleSection title="Más opciones" hint="origen, notas, garantías">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label>Origen de la venta</Label>
            <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={origin} onChange={(e) => { setOrigin(e.target.value); if (e.target.value !== "INSTAGRAM_ADS") setCampaignId(""); }}>
              <option value="ORGANICO">Orgánico</option>
              <option value="INSTAGRAM_ADS">Instagram Ads</option>
              <option value="RECOMENDADO">Recomendado</option>
            </select>
          </div>
          {origin === "INSTAGRAM_ADS" && campaigns.length > 0 && (
            <div>
              <Label>Campaña (opcional)</Label>
              <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={campaignId} onChange={(e) => setCampaignId(e.target.value)}>
                <option value="">— Sin campaña específica —</option>
                {campaigns.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
            </div>
          )}
        </div>

        <div>
          <Label>Notas (opcional)</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </div>

        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" checked={createWarranties} onChange={(e) => setCreateWarranties(e.target.checked)} />
          Crear garantías automáticamente
        </label>
      </CollapsibleSection>

      <div className="flex items-center justify-end border-t pt-3">
        <Button disabled={loading || items.length === 0 || !clientId}>{loading ? "Registrando..." : "Registrar venta"}</Button>
      </div>
    </form>
  );
}
