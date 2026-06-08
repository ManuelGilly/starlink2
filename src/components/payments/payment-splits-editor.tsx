"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PAYMENT_METHODS, METHOD_LABELS, isBolivarMethod } from "@/lib/payments/methods";
import type { PaymentMethod } from "@prisma/client";

export type SplitRow = {
  method: PaymentMethod;
  amountUSD: string; // métodos USD
  amountVes: string; // métodos Bs
  vesRate: string; // tasa Bs/USD
  reference: string;
};

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function emptySplit(rate: number): SplitRow {
  return { method: "ZELLE", amountUSD: "", amountVes: "", vesRate: rate ? String(rate) : "", reference: "" };
}

/** USD efectivo de una fila (deriva de Bs si es método en bolívares). */
export function splitUSD(s: SplitRow): number {
  if (isBolivarMethod(s.method)) {
    const ves = Number(s.amountVes) || 0;
    const rate = Number(s.vesRate) || 0;
    return rate > 0 ? round2(ves / rate) : 0;
  }
  return round2(Number(s.amountUSD) || 0);
}

export function splitsTotalUSD(splits: SplitRow[]): number {
  return round2(splits.reduce((acc, s) => acc + splitUSD(s), 0));
}

/** Convierte filas del editor al payload que espera la API. */
export function toSplitPayload(splits: SplitRow[]) {
  return splits.map((s) =>
    isBolivarMethod(s.method)
      ? { method: s.method, amountVes: Number(s.amountVes) || 0, vesRate: Number(s.vesRate) || 0, reference: s.reference || null }
      : { method: s.method, amountUSD: Number(s.amountUSD) || 0, reference: s.reference || null },
  );
}

type Props = {
  splits: SplitRow[];
  onChange: (splits: SplitRow[]) => void;
  rate: number; // tasa Bs/USD por defecto (AppSetting)
  targetUSD?: number; // total esperado (para mostrar diferencia)
};

export function PaymentSplitsEditor({ splits, onChange, rate, targetUSD }: Props) {
  const total = splitsTotalUSD(splits);
  const diff = targetUSD != null ? round2(total - targetUSD) : null;

  function setRow(idx: number, patch: Partial<SplitRow>) {
    onChange(splits.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  }
  function addRow() {
    onChange([...splits, emptySplit(rate)]);
  }
  function removeRow(idx: number) {
    onChange(splits.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-2">
      <Label>Métodos de pago</Label>
      <div className="space-y-2">
        {splits.map((s, idx) => {
          const bs = isBolivarMethod(s.method);
          return (
            <div key={idx} className="rounded-md border border-border p-2">
              <div className="flex items-center gap-2">
                <select
                  className="h-9 flex-1 rounded-md border border-input bg-background px-2 text-sm"
                  value={s.method}
                  onChange={(e) => setRow(idx, { method: e.target.value as PaymentMethod })}
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>{METHOD_LABELS[m]}</option>
                  ))}
                </select>
                {!bs ? (
                  <Input
                    className="h-9 w-32 text-right font-mono"
                    type="number"
                    step="0.01"
                    min={0}
                    placeholder="USD"
                    value={s.amountUSD}
                    onChange={(e) => setRow(idx, { amountUSD: e.target.value })}
                  />
                ) : (
                  <span className="w-32 text-right font-mono text-sm text-muted-foreground">
                    ${splitUSD(s).toFixed(2)}
                  </span>
                )}
                <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => removeRow(idx)} disabled={splits.length === 1}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              {bs && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1">
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Monto Bs</span>
                    <Input className="h-9 text-right font-mono" type="number" step="0.01" min={0} placeholder="Bs" value={s.amountVes} onChange={(e) => setRow(idx, { amountVes: e.target.value })} />
                  </div>
                  <div className="w-28">
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Tasa Bs/USD</span>
                    <Input className="h-9 text-right font-mono" type="number" step="0.0001" min={0} placeholder="tasa" value={s.vesRate} onChange={(e) => setRow(idx, { vesRate: e.target.value })} />
                  </div>
                </div>
              )}
              <Input
                className="mt-2 h-8 text-xs"
                placeholder="Referencia (opcional)"
                value={s.reference}
                onChange={(e) => setRow(idx, { reference: e.target.value })}
              />
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Agregar método
        </Button>
        <div className="text-right text-sm">
          <span className="mr-2 text-[10px] uppercase tracking-wide text-muted-foreground">Total</span>
          <span className="font-mono font-medium">${total.toFixed(2)}</span>
          {diff != null && Math.abs(diff) >= 0.01 && (
            <span className={`ml-2 text-xs ${diff > 0 ? "text-amber-500" : "text-destructive"}`}>
              ({diff > 0 ? "+" : ""}{diff.toFixed(2)} vs ${targetUSD?.toFixed(2)})
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
