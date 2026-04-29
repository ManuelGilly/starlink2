"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeleteButton({
  endpoint,
  entityLabel,
  entityName,
  redirectTo,
  confirmWord,
}: {
  endpoint: string;
  entityLabel: string; // "producto", "plan", etc.
  entityName: string;  // nombre visible
  redirectTo?: string;
  confirmWord?: string; // palabra que el usuario debe teclear para confirmar (opcional, para borrados sensibles)
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  async function doDelete() {
    setLoading(true);
    const res = await fetch(endpoint, { method: "DELETE" });
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) {
      toast.error(data?.error ?? "No se pudo borrar");
      return;
    }
    toast.success(`${entityLabel} borrado. Registrado en bitácora.`);
    setOpen(false);
    if (redirectTo) router.push(redirectTo);
    router.refresh();
  }

  if (!open) {
    return (
      <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
        <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Borrar
      </Button>
    );
  }

  const mustType = Boolean(confirmWord);
  const ok = !mustType || text === confirmWord;

  return (
    <div className="flex flex-col gap-2 rounded-sm border border-destructive/40 bg-destructive/10 p-3 text-[12px]">
      <div className="font-medium">¿Borrar {entityLabel} <span className="font-mono">{entityName}</span>?</div>
      <div className="text-[11px] text-muted-foreground">Esta acción quedará registrada en la bitácora. Algunas relaciones en cascada pueden eliminarse también.</div>
      {mustType && (
        <input
          className="h-9 rounded-sm border border-border bg-input px-2 text-[12px]"
          placeholder={`Escribe "${confirmWord}" para confirmar`}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      )}
      <div className="flex gap-2">
        <Button variant="destructive" size="sm" disabled={loading || !ok} onClick={doDelete}>
          {loading ? "Borrando…" : "Confirmar"}
        </Button>
        <Button variant="outline" size="sm" onClick={() => { setOpen(false); setText(""); }}>Cancelar</Button>
      </div>
    </div>
  );
}
