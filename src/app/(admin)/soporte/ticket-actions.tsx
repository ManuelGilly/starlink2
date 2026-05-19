"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Ticket = { id: string; status: string; resolution: string | null };

export function TicketActions({ ticket }: { ticket: Ticket }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showResolve, setShowResolve] = useState(false);
  const [resolution, setResolution] = useState(ticket.resolution ?? "");

  async function patch(data: Record<string, any>) {
    setLoading(true);
    const res = await fetch(`/api/soporte/${ticket.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setLoading(false);
    if (!res.ok) return toast.error("Error al actualizar");
    router.refresh();
  }

  if (ticket.status === "ABIERTO") {
    return (
      <div className="flex gap-1.5 flex-wrap">
        <Button size="sm" variant="outline" disabled={loading} onClick={() => patch({ status: "EN_PROCESO" })}>
          Tomar
        </Button>
        <Button size="sm" variant="outline" disabled={loading} onClick={() => setShowResolve(!showResolve)}>
          Resolver
        </Button>
        {showResolve && (
          <div className="w-full mt-2 space-y-2">
            <Textarea rows={2} value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="Describe la resolución..." />
            <Button size="sm" disabled={loading || !resolution} onClick={() => patch({ status: "RESUELTO", resolution })}>
              Guardar resolución
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (ticket.status === "EN_PROCESO") {
    return (
      <div className="flex gap-1.5 flex-wrap">
        <Button size="sm" disabled={loading} onClick={() => setShowResolve(!showResolve)}>
          Resolver
        </Button>
        {showResolve && (
          <div className="w-full mt-2 space-y-2">
            <Textarea rows={2} value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="Describe la resolución..." />
            <Button size="sm" disabled={loading || !resolution} onClick={() => patch({ status: "RESUELTO", resolution })}>
              Guardar resolución
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (ticket.status === "RESUELTO") {
    return (
      <Button size="sm" variant="outline" disabled={loading} onClick={() => patch({ status: "CERRADO" })}>
        Cerrar
      </Button>
    );
  }

  return null;
}
