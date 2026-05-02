"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NuevoClientePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    documentId: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
    telegramChatId: "",
  });
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/clientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (!res.ok) return toast.error("Error al guardar");
    toast.success("Cliente creado");
    router.push("/clientes");
    router.refresh();
  }

  return (
    <div className="p-6">
      <Card className="max-w-2xl">
        <CardHeader><CardTitle>Nuevo cliente</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Nombre</Label><Input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></div>
              <div><Label>Apellido</Label><Input required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></div>
              <div><Label>Cédula / RIF</Label><Input value={form.documentId} onChange={(e) => setForm({ ...form, documentId: e.target.value })} /></div>
              <div><Label>Email</Label><Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div><Label>Teléfono</Label><Input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+58 414 1234567" /></div>
              <div><Label>Dirección</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              <div className="col-span-2"><Label>Telegram Chat ID <span className="text-xs text-muted-foreground">(opcional)</span></Label><Input value={form.telegramChatId} onChange={(e) => setForm({ ...form, telegramChatId: e.target.value })} placeholder="123456789 — el cliente lo obtiene escribiéndole a @userinfobot" /></div>
            </div>
            <div><Label>Notas</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <Button disabled={loading}>{loading ? "Guardando…" : "Guardar"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
