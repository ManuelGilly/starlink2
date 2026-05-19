"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Campaign = { id: string; name: string };

export function AssignPlanForm({ clientId, plans, campaigns = [] }: { clientId: string; plans: any[]; campaigns?: Campaign[] }) {
  const router = useRouter();
  const [planId, setPlanId] = useState(plans[0]?.id ?? "");
  const [priceLocked, setPrice] = useState("");
  const [billingDay, setDay] = useState(1);
  const [origin, setOrigin] = useState("ORGANICO");
  const [campaignId, setCampaignId] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!planId) return;
    setLoading(true);
    const res = await fetch(`/api/clientes/${clientId}/subscripciones`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planId,
        priceLocked: priceLocked || undefined,
        billingDay,
        origin,
        campaignId: campaignId || undefined,
      }),
    });
    setLoading(false);
    if (!res.ok) return toast.error("No se pudo asignar");
    toast.success("Plan asignado");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-3 border-t pt-4">
      <div className="flex flex-wrap items-end gap-3">
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
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label>Origen del cliente</Label>
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={origin}
            onChange={(e) => {
              setOrigin(e.target.value);
              if (e.target.value !== "INSTAGRAM_ADS") setCampaignId("");
            }}
          >
            <option value="ORGANICO">Orgánico</option>
            <option value="INSTAGRAM_ADS">Instagram Ads</option>
            <option value="RECOMENDADO">Recomendado</option>
          </select>
        </div>
        {origin === "INSTAGRAM_ADS" && campaigns.length > 0 && (
          <div>
            <Label>Campaña</Label>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
            >
              <option value="">— Sin campaña específica —</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
        <Button disabled={loading || !planId}>Asignar</Button>
      </div>
    </form>
  );
}
