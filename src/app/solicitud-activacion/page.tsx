import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { SolicitudActivacionForm } from "./form";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "Contratar un plan — Starlink Venezuela",
  description:
    "¿Ya tienes tu antena Starlink? Contrata tu plan en minutos: completa tus datos, elige el plan y sube el comprobante de pago.",
};

export const dynamic = "force-dynamic";

export default async function SolicitudActivacionPage() {
  const plans = await prisma.plan.findMany({
    where: { active: true },
    orderBy: { price: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
      details: true,
      price: true,
      billingCycle: true,
    },
  });

  const planData = plans.map((p) => ({
    id: p.id,
    code: p.code,
    name: p.name,
    description: p.description,
    details: p.details,
    price: Number(p.price),
    billingCycle: p.billingCycle,
  }));

  return (
    <main className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-primary/15 ring-1 ring-primary/40">
              <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_14px_hsl(var(--primary))]" />
            </div>
            <span className="font-display text-[13px] font-semibold uppercase tracking-[0.22em]">
              Starlink
            </span>
            <span className="ml-1 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">VE</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Volver
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 radial-glow" />
        <div className="grid-bg absolute inset-0 opacity-30" />
        <div className="relative mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="eyebrow">Ya tengo antena · Contratar plan</div>
          <h1 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-[-0.02em] sm:text-5xl">
            Activa tu plan en minutos.
          </h1>
          <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-muted-foreground sm:text-base">
            Completa el formulario con tus datos y el ID de tu antena, elige el plan y adjunta el comprobante de pago.
            Un asesor validará la información y activará el servicio.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        {planData.length === 0 ? (
          <div className="rounded-sm border border-border bg-card p-10 text-center text-sm text-muted-foreground">
            No hay planes disponibles en este momento. Escríbenos por WhatsApp y te orientamos.
          </div>
        ) : (
          <SolicitudActivacionForm plans={planData} />
        )}
      </section>
    </main>
  );
}
