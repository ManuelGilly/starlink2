"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Product = { id: string; sku: string; name: string; serialized: boolean };

function todayLocal(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function NewLotForm({ products }: { products: Product[] }) {
  const router = useRouter();
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [quantity, setQuantity] = useState("1");
  const [baseUnitCost, setBaseUnitCost] = useState("");

  const [freightApplies, setFreightApplies] = useState(false);
  const [freightMode, setFreightMode] = useState<"FIXED" | "PERCENT">("FIXED");
  const [freightValue, setFreightValue] = useState("");

  const [taxApplies, setTaxApplies] = useState(false);
  const [taxMode, setTaxMode] = useState<"FIXED" | "PERCENT">("PERCENT");
  const [taxValue, setTaxValue] = useState("");

  const [reference, setReference] = useState("");
  const [purchasedAt, setPurchasedAt] = useState(todayLocal());
  const [notes, setNotes] = useState("");
  const [serials, setSerials] = useState("");
  const [loading, setLoading] = useState(false);

  const product = products.find((p) => p.id === productId);
  const qty = Math.max(0, Math.trunc(Number(quantity) || 0));

  const costs = useMemo(() => {
    const base = Number(baseUnitCost) || 0;
    const baseTotal = round2(base * qty);
    const charge = (applies: boolean, mode: string, value: string) => {
      if (!applies) return 0;
      const v = Number(value) || 0;
      return mode === "PERCENT" ? round2((baseTotal * v) / 100) : round2(v);
    };
    const freightTotal = charge(freightApplies, freightMode, freightValue);
    const taxTotal = charge(taxApplies, taxMode, taxValue);
    const landedTotal = round2(baseTotal + freightTotal + taxTotal);
    const landedUnit = qty > 0 ? round2(landedTotal / qty) : 0;
    return { baseTotal, freightTotal, taxTotal, landedTotal, landedUnit };
  }, [baseUnitCost, qty, freightApplies, freightMode, freightValue, taxApplies, taxMode, taxValue]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!productId) return toast.error("Selecciona un producto");
    if (qty < 1) return toast.error("La cantidad debe ser al menos 1");
    if (!(Number(baseUnitCost) >= 0) || baseUnitCost === "") return toast.error("Indica el costo base unitario");

    const serialList = serials.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
    if (product?.serialized && serialList.length > 0 && serialList.length !== qty) {
      return toast.error(`Indica ${qty} seriales (uno por unidad) o déjalo vacío`);
    }

    setLoading(true);
    const res = await fetch(`/api/compras`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        quantity: qty,
        baseUnitCost: Number(baseUnitCost),
        freight: { applies: freightApplies, mode: freightMode, value: Number(freightValue) || 0 },
        tax: { applies: taxApplies, mode: taxMode, value: Number(taxValue) || 0 },
        reference: reference || undefined,
        purchasedAt: purchasedAt ? new Date(purchasedAt).toISOString() : undefined,
        notes: notes || undefined,
        serials: product?.serialized ? serialList : [],
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return toast.error(typeof data.error === "string" ? data.error : "No se pudo registrar el lote");
    }
    toast.success(`Lote registrado · costo real $${costs.landedUnit.toFixed(2)}/u`);
    setQuantity("1");
    setBaseUnitCost("");
    setFreightApplies(false);
    setFreightValue("");
    setTaxApplies(false);
    setTaxValue("");
    setReference("");
    setNotes("");
    setSerials("");
    router.refresh();
  }

  if (products.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay productos activos. Crea un producto primero.</p>;
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <div className="sm:col-span-2">
          <Label>Producto</Label>
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.serialized ? "· serializado" : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Cantidad</Label>
          <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </div>
        <div>
          <Label>Costo base USD / unidad</Label>
          <Input type="number" step="0.01" min={0} className="font-mono" value={baseUnitCost} onChange={(e) => setBaseUnitCost(e.target.value)} placeholder="0.00" />
        </div>
      </div>

      {/* Flete e impuestos */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ChargeBox
          title="Flete"
          applies={freightApplies}
          setApplies={setFreightApplies}
          mode={freightMode}
          setMode={setFreightMode}
          value={freightValue}
          setValue={setFreightValue}
          resolved={costs.freightTotal}
        />
        <ChargeBox
          title="Impuestos"
          applies={taxApplies}
          setApplies={setTaxApplies}
          mode={taxMode}
          setMode={setTaxMode}
          value={taxValue}
          setValue={setTaxValue}
          resolved={costs.taxTotal}
          percentHint="sobre el costo base"
        />
      </div>

      {/* Resumen de costo real */}
      <div className="grid grid-cols-2 gap-2 rounded-md border border-border bg-muted/20 p-3 text-sm sm:grid-cols-4">
        <Stat label="Costo base" value={`$${costs.baseTotal.toFixed(2)}`} />
        <Stat label="Flete + Imp." value={`$${(costs.freightTotal + costs.taxTotal).toFixed(2)}`} />
        <Stat label="Total lote" value={`$${costs.landedTotal.toFixed(2)}`} />
        <Stat label="Costo real / unidad" value={`$${costs.landedUnit.toFixed(2)}`} highlight />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <Label>Referencia (factura/orden)</Label>
          <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="# factura" />
        </div>
        <div>
          <Label>Fecha de compra</Label>
          <Input type="date" value={purchasedAt} onChange={(e) => setPurchasedAt(e.target.value)} />
        </div>
      </div>

      {product?.serialized && (
        <div>
          <Label>Seriales (opcional · uno por línea o separados por coma)</Label>
          <Textarea value={serials} onChange={(e) => setSerials(e.target.value)} rows={3} placeholder={`Se crearán ${qty} unidades. Si indicas seriales, deben ser exactamente ${qty}.`} />
        </div>
      )}

      <div>
        <Label>Notas (opcional)</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      </div>

      <div className="flex justify-end border-t pt-3">
        <Button disabled={loading || !productId}>{loading ? "Registrando..." : "Registrar lote"}</Button>
      </div>
    </form>
  );
}

function ChargeBox(props: {
  title: string;
  applies: boolean;
  setApplies: (v: boolean) => void;
  mode: "FIXED" | "PERCENT";
  setMode: (v: "FIXED" | "PERCENT") => void;
  value: string;
  setValue: (v: string) => void;
  resolved: number;
  percentHint?: string;
}) {
  return (
    <div className="rounded-md border border-border p-3">
      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" checked={props.applies} onChange={(e) => props.setApplies(e.target.checked)} />
        {props.title}
        {props.applies && <span className="ml-auto font-mono text-xs text-muted-foreground">${props.resolved.toFixed(2)}</span>}
      </label>
      {props.applies && (
        <div className="mt-2 flex items-center gap-2">
          <select
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            value={props.mode}
            onChange={(e) => props.setMode(e.target.value as "FIXED" | "PERCENT")}
          >
            <option value="FIXED">Monto USD</option>
            <option value="PERCENT">Porcentaje %</option>
          </select>
          <Input
            type="number"
            step="0.01"
            min={0}
            className="h-9 font-mono"
            value={props.value}
            onChange={(e) => props.setValue(e.target.value)}
            placeholder={props.mode === "PERCENT" ? "%" : "USD"}
          />
        </div>
      )}
      {props.applies && props.mode === "PERCENT" && props.percentHint && (
        <p className="mt-1 text-[11px] text-muted-foreground">% {props.percentHint}</p>
      )}
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`font-mono ${highlight ? "text-base font-semibold text-primary" : "text-sm"}`}>{value}</div>
    </div>
  );
}
