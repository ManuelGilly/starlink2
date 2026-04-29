"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProjectionForm({ initialWindow, initialProjection }: { initialWindow: number; initialProjection: number }) {
  const router = useRouter();
  const [w, setW] = useState(initialWindow);
  const [p, setP] = useState(initialProjection);

  function apply(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/inventario?windowDays=${w}&projectionDays=${p}`);
  }

  return (
    <form onSubmit={apply} className="mb-4 flex items-end gap-3 border-b pb-4">
      <div><Label>Ventana histórica (días)</Label><Input type="number" value={w} onChange={(e) => setW(Number(e.target.value))} className="w-28" /></div>
      <div><Label>Proyección (días)</Label><Input type="number" value={p} onChange={(e) => setP(Number(e.target.value))} className="w-28" /></div>
      <Button type="submit">Actualizar</Button>
    </form>
  );
}
