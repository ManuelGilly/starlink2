"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function PaymentActions({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function setStatus(status: "CONFIRMADO" | "RECHAZADO") {
    setLoading(true);
    const res = await fetch(`/api/pagos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLoading(false);
    if (!res.ok) return toast.error("Error");
    toast.success(status === "CONFIRMADO" ? "Pago confirmado" : "Pago rechazado");
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" disabled={loading} onClick={() => setStatus("CONFIRMADO")}>Confirmar</Button>
      <Button size="sm" variant="destructive" disabled={loading} onClick={() => setStatus("RECHAZADO")}>Rechazar</Button>
    </div>
  );
}
