"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";

export default function CambiarPasswordPage() {
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirm) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? "Error al cambiar la contraseña");
      return;
    }
    toast.success("Contraseña actualizada. Vuelve a iniciar sesión.");
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-primary/15 ring-1 ring-primary/40">
            <div className="h-2 w-2 rounded-full bg-primary" />
          </div>
          <span className="font-display text-sm font-semibold uppercase tracking-[0.25em]">Starlink VE</span>
        </div>

        <div className="eyebrow mb-3">Seguridad</div>
        <h2 className="mb-2 font-display text-3xl font-semibold tracking-tight">Cambia tu contraseña</h2>
        <p className="mb-8 text-sm text-muted-foreground">
          Por seguridad, debes sustituir la contraseña temporal antes de continuar.
        </p>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Contraseña actual</Label>
            <Input type="password" required value={currentPassword} onChange={(e) => setCurrent(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Nueva contraseña</Label>
            <Input type="password" minLength={8} required value={newPassword} onChange={(e) => setNew(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Confirmar nueva contraseña</Label>
            <Input type="password" minLength={8} required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Guardando…" : "Guardar contraseña"}
          </Button>
        </form>
      </div>
    </div>
  );
}
