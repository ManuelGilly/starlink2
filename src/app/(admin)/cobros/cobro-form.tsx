"use client";

import { useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatUSD } from "@/lib/utils";
import type { Row } from "./workspace";

const METHODS = [
  "ZELLE",
  "PAYPAL",
  "BINANCE",
  "EFECTIVO_USD",
  "TRANSFERENCIA_USD",
  "PAGO_MOVIL",
  "OTRO",
] as const;
type Method = (typeof METHODS)[number];

const METHOD_LABELS: Record<Method, string> = {
  ZELLE: "Zelle",
  PAYPAL: "PayPal",
  BINANCE: "Binance",
  EFECTIVO_USD: "Efectivo USD",
  TRANSFERENCIA_USD: "Transferencia USD",
  PAGO_MOVIL: "Pago Móvil",
  OTRO: "Otro",
};

type Props = {
  row: Row;
  periodoInicio: string;
  periodoFin: string;
  onClose: () => void;
  onSuccess: () => void;
};

export function CobroForm({ row, periodoInicio, periodoFin, onClose, onSuccess }: Props) {
  const [method, setMethod] = useState<Method>("ZELLE");
  const [amount, setAmount] = useState(String(row.priceLocked));
  const [starlinkCost, setStarlinkCost] = useState(String(row.planCost));
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const amountNum = Number(amount) || 0;
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
        amount: amountNum,
        starlinkCost: starlinkNum > 0 ? starlinkNum : null,
        method,
        reference: reference || null,
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
      return toast.error(data.error?.toString?.() ?? "No se pudo registrar el cobro");
    }
    toast.success("Cobro registrado");
    onSuccess();
  }

  const selectCls =
    "h-10 w-full rounded-sm border border-border bg-input px-3 text-sm";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded border border-border bg-background p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide">
              Registrar cobro
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {row.clientName} · {row.planName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {/* Plataforma */}
          <div>
            <Label>Plataforma de pago</Label>
            <select
              className={selectCls}
              value={method}
              onChange={(e) => setMethod(e.target.value as Method)}
            >
              {METHODS.map((m) => (
                <option key={m} value={m}>
                  {METHOD_LABELS[m]}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Monto cobrado */}
            <div>
              <Label>Cobrado al cliente (USD)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            {/* Costo Starlink */}
            <div>
              <Label>Pagamos a Starlink (USD)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={starlinkCost}
                onChange={(e) => setStarlinkCost(e.target.value)}
              />
            </div>
          </div>

          {/* Ganancia calculada */}
          <div className="flex items-center justify-between rounded-sm border border-border bg-muted/30 px-3 py-2">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Ganancia
            </span>
            <span
              className={`text-sm font-semibold ${
                ganancia >= 0 ? "text-green-500" : "text-destructive"
              }`}
            >
              {formatUSD(ganancia)}
            </span>
          </div>

          {/* Referencia */}
          <div>
            <Label>
              Referencia{" "}
              <span className="text-xs text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="# confirmación, hash, comprobante…"
            />
          </div>

          {/* Notas */}
          <div>
            <Label>
              Notas{" "}
              <span className="text-xs text-muted-foreground">(opcional)</span>
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Registrando…" : "Confirmar cobro"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
