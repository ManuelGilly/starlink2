"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ROLES = ["ADMIN", "INVENTARIO", "CLIENTE"] as const;

export function EditUserForm({ user }: { user: any }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: user.name,
    active: user.active,
    roles: user.roles as string[],
  });
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

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
    const res = await fetch(`/api/usuarios/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (!res.ok) return toast.error("Error al guardar");
    toast.success("Usuario actualizado. Cambios registrados en bitácora.");
    router.refresh();
  }

  async function resetPassword() {
    if (!confirm("¿Generar una nueva contraseña temporal y enviarla por email?")) return;
    setResetLoading(true);
    const res = await fetch(`/api/usuarios/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resetPassword: true }),
    });
    setResetLoading(false);
    if (!res.ok) return toast.error("Error al restablecer");
    toast.success("Contraseña restablecida. Se envió email al usuario.");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Email</Label><Input value={user.email} disabled /></div>
        <div><Label>Nombre</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
      </div>
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
      <div className="flex items-center gap-2">
        <input id="active" type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
        <Label htmlFor="active">Activo</Label>
      </div>
      <div className="flex gap-2">
        <Button disabled={loading}>{loading ? "Guardando…" : "Guardar cambios"}</Button>
        <Button type="button" variant="outline" onClick={resetPassword} disabled={resetLoading}>
          {resetLoading ? "Restableciendo…" : "Restablecer contraseña"}
        </Button>
      </div>
    </form>
  );
}
