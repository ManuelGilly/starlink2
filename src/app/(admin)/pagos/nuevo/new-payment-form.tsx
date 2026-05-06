"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const METHODS = ["ZELLE", "PAYPAL", "BINANCE", "EFECTIVO_USD", "TRANSFERENCIA_USD", "OTRO"] as const;

type Subscription = { id: string; planName: string; priceLocked: number | string };
type Client = { id: string; firstName: string; lastName: string; subscriptions: Subscription[] };

function nowLocal(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

export function NewPaymentForm({ clients }: { clients: Client[] }) {
  const router = useRouter();
  const [clientId, setClientId] = useState<string>(clients[0]?.id ?? "");

  const subscriptions = useMemo(
    () => clients.find((c) => c.id === clientId)?.subscriptions ?? [],
    [clientId, clients],
  );
  const [subscriptionId, setSubscriptionId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [method, setMethod] = useState<(typeof METHODS)[number]>("ZELLE");
  const [reference, setReference] = useState("");
  const [paidAt, setPaidAt] = useState(nowLocal());
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  function onClientChange(id: string) {
    setClientId(id);
    setSubscriptionId("");
    setAmount("");
  }

  function onSubscriptionChange(id: string) {
    setSubscriptionId(id);
    const sub = subscriptions.find((s) => s.id === id);
    if (sub && !amount) setAmount(String(Number(sub.priceLocked)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId) return toast.error("Selecciona un cliente");
    if (!amount || Number(amount) <= 0) return toast.error("Monto inválido");
    setLoading(true);
    const res = await fetch("/api/pagos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        subscriptionId: subscriptionId || null,
        amount: Number(amount),
        method,
        reference: reference || null,
        paidAt: paidAt ? new Date(paidAt).toISOString() : null,
        periodStart: periodStart ? new Date(periodStart).toISOString() : null,
        periodEnd: periodEnd ? new Date(periodEnd).toISOString() : null,
        notes: notes || null,
        status: "CONFIRMADO",
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return toast.error(data.error?.toString?.() ?? "No se pudo registrar el pago");
    }
    const created = await res.json();
    toast.success("Pago registrado como confirmado");
    router.push(`/pagos/${created.id}`);
    router.refresh();
  }

  if (clients.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay clientes registrados.</p>;
  }

  const selectCls = "h-10 w-full rounded-sm border border-border bg-input px-3 text-sm";

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="rounded-sm border border-border bg-muted/20 p-3 text-[12px] text-muted-foreground">
        Este pago se registrará como <span className="font-mono font-medium">CONFIRMADO</span>. Para reportes pendientes de revisión, usar el flujo del cliente.
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Cliente</Label>
          <select className={selectCls} value={clientId} onChange={(e) => onClientChange(e.target.value)}>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
            ))}
          </select>
        </div>
        <div>
          <Label>Suscripción <span className="text-xs text-muted-foreground">(opcional)</span></Label>
          <select className={selectCls} value={subscriptionId} onChange={(e) => onSubscriptionChange(e.target.value)}>
            <option value="">— Sin asociar —</option>
            {subscriptions.map((s) => (
              <option key={s.id} value={s.id}>{s.planName} · ${Number(s.priceLocked)}</option>
            ))}
          </select>
        </div>
        <div>
          <Label>Monto (USD)</Label>
          <Input type="number" step="0.01" min="0" required value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div>
          <Label>Método</Label>
          <select className={selectCls} value={method} onChange={(e) => setMethod(e.target.value as any)}>
            {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <Label>Referencia</Label>
          <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="# confirmación, hash…" />
        </div>
        <div>
          <Label>Fecha de pago</Label>
          <Input type="datetime-local" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
        </div>
        <div>
          <Label>Período inicio <span className="text-xs text-muted-foreground">(opcional)</span></Label>
          <Input type="datetime-local" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
        </div>
        <div>
          <Label>Período fin <span className="text-xs text-muted-foreground">(opcional)</span></Label>
          <Input type="datetime-local" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
        </div>
      </div>
      <div>
        <Label>Notas</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      </div>
      <Button disabled={loading}>{loading ? "Registrando…" : "Registrar pago confirmado"}</Button>
    </form>
  );
}
