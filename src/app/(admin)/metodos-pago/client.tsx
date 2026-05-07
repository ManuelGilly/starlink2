"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

type Method = {
  code: string;
  label: string;
  accountEmail: string | null;
  accountInfo: string | null;
  commissionPct: number | null;
  requiresReceipt: boolean;
  showVesAmount: boolean;
  instructions: string | null;
  active: boolean;
  order: number;
};

export function PaymentMethodsAdmin({
  methods,
  paraleloRate,
}: {
  methods: Method[];
  paraleloRate: string;
}) {
  const router = useRouter();
  const [rate, setRate] = useState(paraleloRate);
  const [savingRate, setSavingRate] = useState(false);

  async function saveRate() {
    setSavingRate(true);
    try {
      const res = await fetch("/api/admin/app-settings/BINANCE_PARALELO_VES_USD", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: rate }),
      });
      if (!res.ok) throw new Error("No se pudo guardar la tasa");
      toast.success("Tasa actualizada");
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Error");
    } finally {
      setSavingRate(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tasa Bs / USD (Binance paralelo)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-[13px] text-muted-foreground">
            Se usa para mostrar el monto en bolívares cuando el cliente elige Pago móvil. Actualízala cuando cambie el paralelo.
          </p>
          <div className="flex items-end gap-3">
            <div className="flex-1 max-w-xs">
              <Label htmlFor="rate">Bs por 1 USD</Label>
              <Input
                id="rate"
                type="number"
                step="0.01"
                min="0"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
              />
            </div>
            <Button onClick={saveRate} disabled={savingRate} className="h-10">
              {savingRate ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Guardar tasa
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {methods.map((m) => (
          <MethodCard key={m.code} initial={m} onSaved={() => router.refresh()} />
        ))}
      </div>
    </div>
  );
}

function MethodCard({ initial, onSaved }: { initial: Method; onSaved: () => void }) {
  const [m, setM] = useState(initial);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/payment-methods/${m.code}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: m.label,
          accountEmail: m.accountEmail || null,
          accountInfo: m.accountInfo || null,
          commissionPct: m.commissionPct === null || Number.isNaN(m.commissionPct) ? null : m.commissionPct,
          requiresReceipt: m.requiresReceipt,
          showVesAmount: m.showVesAmount,
          instructions: m.instructions || null,
          active: m.active,
          order: m.order,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error?.formErrors?.[0] ?? "No se pudo guardar");
      toast.success(`${m.label} guardado`);
      onSaved();
    } catch (e: any) {
      toast.error(typeof e?.message === "string" ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className={m.active ? "" : "opacity-60"}>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">{m.label}</CardTitle>
          <Badge variant={m.active ? "default" : "secondary"}>{m.code}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Etiqueta visible</Label>
            <Input value={m.label} onChange={(e) => setM({ ...m, label: e.target.value })} />
          </div>
          <div>
            <Label>Orden</Label>
            <Input
              type="number"
              min={0}
              value={m.order}
              onChange={(e) => setM({ ...m, order: Number(e.target.value) || 0 })}
            />
          </div>
        </div>

        <div>
          <Label>Email / cuenta</Label>
          <Input
            placeholder="pagos@starlink.ve"
            value={m.accountEmail ?? ""}
            onChange={(e) => setM({ ...m, accountEmail: e.target.value })}
          />
        </div>

        <div>
          <Label>Datos / instrucciones</Label>
          <Textarea
            rows={3}
            placeholder="Información que verá el cliente al elegir este método"
            value={m.accountInfo ?? ""}
            onChange={(e) => setM({ ...m, accountInfo: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Comisión % (opcional)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="Ej. 5.40 (PayPal)"
              value={m.commissionPct ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                setM({ ...m, commissionPct: v === "" ? null : Number(v) });
              }}
            />
          </div>
          <div className="flex flex-col gap-2 pt-6">
            <ToggleRow
              label="Activo"
              checked={m.active}
              onChange={(v) => setM({ ...m, active: v })}
            />
            <ToggleRow
              label="Requiere comprobante"
              checked={m.requiresReceipt}
              onChange={(v) => setM({ ...m, requiresReceipt: v })}
            />
            <ToggleRow
              label="Mostrar monto en Bs"
              checked={m.showVesAmount}
              onChange={(v) => setM({ ...m, showVesAmount: v })}
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Guardar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-[13px]">
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-border"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}
