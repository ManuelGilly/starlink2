"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function BitacoraFilters({
  actions,
  entities,
  users,
  initial,
}: {
  actions: string[];
  entities: string[];
  users: Array<{ id: string; name: string; email: string }>;
  initial: Record<string, string | undefined>;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    entity: initial.entity ?? "",
    action: initial.action ?? "",
    userId: initial.userId ?? "",
    from: initial.from ?? "",
    to: initial.to ?? "",
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    Object.entries(form).forEach(([k, v]) => v && params.set(k, v));
    router.push("/bitacora?" + params.toString());
  }
  function clear() {
    setForm({ entity: "", action: "", userId: "", from: "", to: "" });
    router.push("/bitacora");
  }

  const selectCls = "h-10 w-full rounded-sm border border-border bg-input px-3 text-[13px]";

  return (
    <form onSubmit={submit} className="grid grid-cols-2 gap-3 md:grid-cols-6">
      <div>
        <Label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Entidad</Label>
        <select className={selectCls} value={form.entity} onChange={(e) => setForm({ ...form, entity: e.target.value })}>
          <option value="">Todas</option>
          {entities.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>
      <div>
        <Label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Acción</Label>
        <select className={selectCls} value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })}>
          <option value="">Todas</option>
          {actions.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
      <div>
        <Label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Usuario</Label>
        <select className={selectCls} value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })}>
          <option value="">Todos</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>
      <div>
        <Label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Desde</Label>
        <Input type="date" value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} />
      </div>
      <div>
        <Label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Hasta</Label>
        <Input type="date" value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} />
      </div>
      <div className="flex items-end gap-2">
        <Button type="submit">Aplicar</Button>
        <Button type="button" variant="outline" onClick={clear}>Limpiar</Button>
      </div>
    </form>
  );
}
