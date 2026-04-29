"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ChannelToggle({ type, enabled }: { type: string; enabled: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const res = await fetch("/api/notificaciones/canales", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, enabled: !enabled }),
    });
    setLoading(false);
    if (!res.ok) return toast.error("Error");
    toast.success(enabled ? "Canal deshabilitado" : "Canal habilitado");
    router.refresh();
  }

  return (
    <Button size="sm" variant={enabled ? "destructive" : "default"} onClick={toggle} disabled={loading}>
      {enabled ? "Desactivar" : "Activar"}
    </Button>
  );
}
