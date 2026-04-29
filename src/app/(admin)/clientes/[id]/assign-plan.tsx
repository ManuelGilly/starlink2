"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AssignPlanForm({ clientId, plans }: { clientId: string; plans: any[] }) {
  const router = useRouter();
  const [planId, setPlanId] = useState(plans[0]?.id ?? "");
  const [priceLocked, setPrice] = useState("");
  const [billingDay, setDay] = useState(1);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!planId) return;
    setLoading(true);
    const res = await fetch(`/api/clientes/${clientId}/subscripciones`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId, priceLocked: priceLocked || undefined, billingDay }),
    });
    setLoading(false);
    if (!res.ok) return toast.error("No se pudo asignar");
    toast.success("Plan asignado");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3 border-t pt-4">
      <div>
        <Label>Plan</Label>
        <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={planId} onChange={(e) => setPlanId(e.target.value)}>
          {plans.map((p) => (<option key={p.id} value={p.id}>{p.name} — ${Number(p.price).toFixed(2)}</option>))}
        </select>
      </div>
      <div>
        <Label>Precio (USD) — opcional</Label>
        <Input type="number" step="0.01" value={priceLocked} onChange={(e) => setPrice(e.target.value)} />
      </div>
      <div>
        <Label>Día de cobro</Label>
        <Input type="number" min={1} max={28} value={billingDay} onChange={(e) => setDay(Number(e.target.value))} />
      </div>
      <Button disabled={loading || !planId}>Asignar</Button>
    </form>
  );
}
