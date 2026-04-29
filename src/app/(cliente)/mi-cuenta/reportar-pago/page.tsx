"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Topbar } from "@/components/layout/topbar";

const METHODS = ["ZELLE", "PAYPAL", "BINANCE", "EFECTIVO_USD", "TRANSFERENCIA_USD", "OTRO"] as const;

export default function ReportarPagoPage() {
  const router = useRouter();
  const [subs, setSubs] = useState<any[]>([]);
  const [form, setForm] = useState({
    subscriptionId: "",
    amount: "",
    method: "ZELLE" as (typeof METHODS)[number],
    reference: "",
    receiptUrl: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Endpoint genérico: podríamos exponer /api/mi-cuenta/subscripciones; por simplicidad el usuario escribe el monto.
    fetch("/api/mi-cuenta/subscripciones").then((r) => (r.ok ? r.json() : [])).then(setSubs).catch(() => {});
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/reportes-pago", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, subscriptionId: form.subscriptionId || null, receiptUrl: form.receiptUrl || null }),
    });
    setLoading(false);
    if (!res.ok) return toast.error("Error al reportar");
    toast.success("Pago reportado. Pendiente de confirmación.");
    router.push("/mi-cuenta");
    router.refresh();
  }

  return (
    <>
      <Topbar title="Reportar pago" />
      <div className="p-6">
        <Card className="max-w-xl">
          <CardHeader><CardTitle>Nuevo reporte de pago</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label>Suscripción (opcional)</Label>
                <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.subscriptionId} onChange={(e) => setForm({ ...form, subscriptionId: e.target.value })}>
                  <option value="">— ninguna —</option>
                  {subs.map((s) => (<option key={s.id} value={s.id}>{s.plan.name} (${Number(s.priceLocked).toFixed(2)})</option>))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Monto (USD)</Label><Input type="number" step="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
                <div>
                  <Label>Método</Label>
                  <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value as any })}>
                    {METHODS.map((m) => (<option key={m} value={m}>{m}</option>))}
                  </select>
                </div>
              </div>
              <div><Label>Referencia / # confirmación</Label><Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} /></div>
              <div><Label>URL del comprobante (opcional)</Label><Input type="url" value={form.receiptUrl} onChange={(e) => setForm({ ...form, receiptUrl: e.target.value })} /></div>
              <div><Label>Notas</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <Button disabled={loading}>{loading ? "Enviando…" : "Reportar pago"}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
