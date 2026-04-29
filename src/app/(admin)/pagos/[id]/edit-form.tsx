"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const METHODS = ["ZELLE", "PAYPAL", "BINANCE", "EFECTIVO_USD", "TRANSFERENCIA_USD", "OTRO"] as const;
const STATUSES = ["PENDIENTE", "REPORTADO", "CONFIRMADO", "RECHAZADO"] as const;

function toDateInput(d: any): string {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 16);
}

export function EditPaymentForm({ payment }: { payment: any }) {
  const router = useRouter();
  const [form, setForm] = useState({
    amount: String(payment.amount),
    method: payment.method as (typeof METHODS)[number],
    status: payment.status as (typeof STATUSES)[number],
    reference: payment.reference ?? "",
    paidAt: toDateInput(payment.paidAt),
    periodStart: toDateInput(payment.periodStart),
    periodEnd: toDateInput(payment.periodEnd),
    notes: payment.notes ?? "",
  });
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const body: any = { ...form };
    body.paidAt = form.paidAt ? new Date(form.paidAt).toISOString() : null;
    body.periodStart = form.periodStart ? new Date(form.periodStart).toISOString() : null;
    body.periodEnd = form.periodEnd ? new Date(form.periodEnd).toISOString() : null;
    const res = await fetch(`/api/pagos/${payment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (!res.ok) return toast.error("Error al guardar");
    toast.success("Pago actualizado. Cambios registrados en bitácora.");
    router.refresh();
  }

  const selectCls = "h-10 w-full rounded-sm border border-border bg-input px-3 text-sm";

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Monto (USD)</Label><Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
        <div>
          <Label>Método</Label>
          <select className={selectCls} value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value as any })}>
            {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <Label>Estado</Label>
          <select className={selectCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div><Label>Referencia</Label><Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} /></div>
        <div><Label>Fecha de pago</Label><Input type="datetime-local" value={form.paidAt} onChange={(e) => setForm({ ...form, paidAt: e.target.value })} /></div>
        <div /><div><Label>Período inicio</Label><Input type="datetime-local" value={form.periodStart} onChange={(e) => setForm({ ...form, periodStart: e.target.value })} /></div>
        <div><Label>Período fin</Label><Input type="datetime-local" value={form.periodEnd} onChange={(e) => setForm({ ...form, periodEnd: e.target.value })} /></div>
      </div>
      <div><Label>Notas</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
      <Button disabled={loading}>{loading ? "Guardando…" : "Guardar cambios"}</Button>
    </form>
  );
}
