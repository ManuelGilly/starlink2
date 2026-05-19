"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Campaign = {
  id: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  budget: string | number;
  messagesReceived: number;
  status: string;
  platform: string;
  adUrl: string | null;
  notes: string | null;
};

export function EditCampaignPanel({ campaign }: { campaign: Campaign }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: campaign.name,
    description: campaign.description ?? "",
    startDate: campaign.startDate.slice(0, 10),
    endDate: campaign.endDate ? campaign.endDate.slice(0, 10) : "",
    budget: String(Number(campaign.budget)),
    messagesReceived: String(campaign.messagesReceived),
    status: campaign.status,
    platform: campaign.platform,
    adUrl: campaign.adUrl ?? "",
    notes: campaign.notes ?? "",
  });

  function set(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/campanas/${campaign.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        description: form.description || null,
        startDate: new Date(form.startDate).toISOString(),
        endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
        budget: Number(form.budget),
        messagesReceived: Number(form.messagesReceived),
        status: form.status,
        platform: form.platform,
        adUrl: form.adUrl || null,
        notes: form.notes || null,
      }),
    });
    setLoading(false);
    if (!res.ok) return toast.error("No se pudo actualizar");
    toast.success("Campaña actualizada");
    router.refresh();
  }

  async function deleteCampaign() {
    if (!confirm("¿Eliminar esta campaña? Las ventas vinculadas quedarán sin campaña asociada.")) return;
    setLoading(true);
    await fetch(`/api/campanas/${campaign.id}`, { method: "DELETE" });
    toast.success("Campaña eliminada");
    router.push("/marketing");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Editar campaña</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Label>Nombre</Label>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div>
              <Label>Plataforma</Label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.platform}
                onChange={(e) => set("platform", e.target.value)}
              >
                <option>Instagram</option>
                <option>Facebook</option>
                <option>TikTok</option>
                <option>Google</option>
                <option>Otro</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <Label>Fecha inicio</Label>
              <Input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
            </div>
            <div>
              <Label>Fecha fin</Label>
              <Input type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} />
            </div>
            <div>
              <Label>Inversión (USD)</Label>
              <Input type="number" step="0.01" min={0} value={form.budget} onChange={(e) => set("budget", e.target.value)} />
            </div>
            <div>
              <Label>Mensajes recibidos</Label>
              <Input type="number" min={0} value={form.messagesReceived} onChange={(e) => set("messagesReceived", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label>Estado</Label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
              >
                <option value="BORRADOR">Borrador</option>
                <option value="ACTIVA">Activa</option>
                <option value="PAUSADA">Pausada</option>
                <option value="FINALIZADA">Finalizada</option>
              </select>
            </div>
            <div>
              <Label>URL del anuncio</Label>
              <Input value={form.adUrl} onChange={(e) => set("adUrl", e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Notas</Label>
            <Textarea rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </div>

          <div className="flex items-center justify-between border-t pt-3">
            <Button type="button" variant="destructive" size="sm" onClick={deleteCampaign} disabled={loading}>
              Eliminar campaña
            </Button>
            <Button disabled={loading}>{loading ? "Guardando..." : "Guardar cambios"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
