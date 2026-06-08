"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatUSD } from "@/lib/utils";
import {
  PaymentSplitsEditor,
  emptySplit,
  splitsTotalUSD,
  toSplitPayload,
  type SplitRow,
} from "@/components/payments/payment-splits-editor";
import type { Row } from "./workspace";

type Props = {
  row: Row;
  periodoInicio: string;
  periodoFin: string;
  rate: number;
  onClose: () => void;
  onSuccess: () => void;
};

export function CobroForm({ row, periodoInicio, periodoFin, rate, onClose, onSuccess }: Props) {
  const [splits, setSplits] = useState<SplitRow[]>(() => [
    { ...emptySplit(rate), amountUSD: String(row.priceLocked) },
  ]);
  const [starlinkCost, setStarlinkCost] = useState(String(row.planCost));
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const amountNum = useMemo(() => splitsTotalUSD(splits), [splits]);
  const starlinkNum = Number(starlinkCost) || 0;
  const ganancia = amountNum - starlinkNum;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (amountNum <= 0) return toast.error("El monto cobrado debe ser mayor a 0");
    setLoading(true);
    const res = await fetch("/api/pagos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: row.clientId,
        subscriptionId: row.subscriptionId,
        splits: toSplitPayload(splits),
        starlinkCost: starlinkNum > 0 ? starlinkNum : null,
        paidAt: new Date().toISOString(),
        periodStart: periodoInicio,
        periodEnd: periodoFin,
        status: "CONFIRMADO",
        notes: notes || null,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return toast.error(typeof data.error === "string" ? data.error : "No se pudo registrar el cobro");
    }
    toast.success("Cobro registrado");
    onSuccess();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded border border-border bg-background p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide">Registrar cobro</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {row.clientName} · {row.planName}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <PaymentSplitsEditor splits={splits} onChange={setSplits} rate={rate} targetUSD={row.priceLocked} />

          <div>
            <Label>Pagamos a Starlink (USD)</Label>
            <Input type="number" step="0.01" min="0" value={starlinkCost} onChange={(e) => setStarlinkCost(e.target.value)} />
          </div>

          <div className="flex items-center justify-between rounded-sm border border-border bg-muted/30 px-3 py-2">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Ganancia</span>
            <span className={`text-sm font-semibold ${ganancia >= 0 ? "text-green-500" : "text-destructive"}`}>
              {formatUSD(ganancia)}
            </span>
          </div>

          <div>
            <Label>Notas <span className="text-xs text-muted-foreground">(opcional)</span></Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Registrando…" : "Confirmar cobro"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
