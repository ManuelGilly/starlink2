"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ROLES = ["ADMIN", "INVENTARIO", "CLIENTE"] as const;

export default function NuevoUsuarioPage() {
  const router = useRouter();
  const [clients, setClients] = useState<any[]>([]);
  const [form, setForm] = useState({ email: "", name: "", roles: ["CLIENTE"] as string[], clientId: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/clientes").then((r) => r.json()).then(setClients).catch(() => {});
  }, []);

  function toggleRole(r: string) {
    setForm((f) => ({
      ...f,
      roles: f.roles.includes(r) ? f.roles.filter((x) => x !== r) : [...f.roles, r],
    }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.roles.length === 0) return toast.error("Asigna al menos un rol");
    setLoading(true);
    const res = await fetch("/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, clientId: form.clientId || null }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return toast.error(data?.error?.formErrors?.[0] ?? "Error al crear usuario");
    toast.success(
      data.tempPasswordPreview
        ? `Usuario creado. Contraseña temporal (preview dev): ${data.tempPasswordPreview}`
        : "Usuario creado. La contraseña temporal fue enviada por email.",
      { duration: 10000 },
    );
    router.push("/usuarios");
    router.refresh();
  }

  return (
    <div className="p-6">
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Nuevo usuario</CardTitle>
          <p className="text-sm text-muted-foreground">
            El usuario recibirá una contraseña temporal en su bandeja de correo electrónico y deberá cambiarla al primer
            inicio de sesión.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div><Label>Nombre completo</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Email</Label><Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div>
              <Label>Roles</Label>
              <div className="flex gap-4 pt-2">
                {ROLES.map((r) => (
                  <label key={r} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.roles.includes(r)} onChange={() => toggleRole(r)} />
                    {r}
                  </label>
                ))}
              </div>
            </div>
            {form.roles.includes("CLIENTE") && (
              <div>
                <Label>Vincular con cliente existente (opcional)</Label>
                <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
                  <option value="">— no vincular —</option>
                  {clients.map((c) => (<option key={c.id} value={c.id}>{c.firstName} {c.lastName} · {c.email}</option>))}
                </select>
              </div>
            )}
            <Button disabled={loading}>{loading ? "Creando…" : "Crear usuario"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
