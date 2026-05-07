import type { Metadata } from "next";
import Link from "next/link";
import {
  Anchor,
  ArrowRight,
  Award,
  BadgeCheck,
  Briefcase,
  Building2,
  Check,
  ClipboardCheck,
  Compass,
  Globe,
  HeadphonesIcon,
  Home as HomeIcon,
  Instagram,
  Lightbulb,
  Lock,
  MapPin,
  MessageCircle,
  Mountain,
  Network,
  PhoneCall,
  Radio,
  Satellite,
  ShieldCheck,
  Signal,
  Sparkles,
  Tractor,
  Zap,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/rbac";
import { formatUSD } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "Starlink Venezuela — Internet satelital en cualquier parte del país",
  description:
    "Internet de alta velocidad vía satélite. Planes residenciales, móviles y empresariales. Instalación profesional y soporte local en Venezuela.",
  openGraph: {
    title: "Starlink Venezuela",
    description:
      "Velocidades de 50 a 250 Mbps vía satélite. En cualquier rincón del país. Planes Residencial, Roam y Business.",
    type: "website",
    locale: "es_VE",
  },
};

const BILLING_LABEL: Record<string, string> = {
  MONTHLY: "/ mes",
  YEARLY: "/ año",
  ONE_TIME: "pago único",
};

function waLink(phone: string, text: string): string {
  const n = phone.replace(/\D/g, "");
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
}

export default async function Home() {
  const [user, plans, products] = await Promise.all([
    getCurrentUser(),
    prisma.plan.findMany({ where: { active: true }, orderBy: { price: "asc" } }),
    prisma.product.findMany({ where: { active: true }, orderBy: { salePrice: "asc" }, take: 6 }),
  ]);

  const whatsapp = process.env.CONTACT_WHATSAPP ?? "+584141234567";
  const instagram = process.env.CONTACT_INSTAGRAM ?? "starlink.venezuela";
  const email = process.env.CONTACT_EMAIL ?? "ventas@starlink.ve";
  const city = process.env.CONTACT_CITY ?? "Venezuela";

  const portalHref = user
    ? user.roles.includes("ADMIN") || user.roles.includes("INVENTARIO")
      ? "/dashboard"
      : "/mi-cuenta"
    : "/login";
  const portalLabel = user ? "Ir a mi panel" : "Portal cliente";

  const waInfo = waLink(whatsapp, "Hola 👋 Quisiera información sobre Starlink Venezuela.");

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* ============ NAV ============ */}
      <nav className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
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
            <Link href="#planes" className="hidden text-[11px] uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground sm:block">
              Planes
            </Link>
            <Link href="#equipos" className="hidden text-[11px] uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground sm:block">
              Equipos
            </Link>
            <Link href="#asesorias" className="hidden text-[11px] uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground sm:block">
              Asesorías
            </Link>
            <Link href="#faq" className="hidden text-[11px] uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground sm:block">
              FAQ
            </Link>
            <Link href="/solicitud-activacion" className="hidden text-[11px] uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground sm:block">
              Ya tengo antena
            </Link>
            <ThemeToggle />
            <Link href={portalHref}>
              <Button size="sm" variant="outline" className="h-9 px-3">
                {portalLabel}
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="aurora absolute inset-0" />
        <div className="grid-bg absolute inset-0 opacity-30" />
        <div className="stars absolute inset-0" />
        <div className="stars-alt absolute inset-0" />
        <div className="noise absolute inset-0" />
        <div className="beam-scan" />

        {/* Orbit decoration */}
        <div className="pointer-events-none absolute -right-40 top-1/2 hidden -translate-y-1/2 lg:block">
          <div className="orbit-spin-slow relative h-[640px] w-[640px] rounded-full border border-primary/15">
            <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
              <div className="signal-pulse h-3 w-3 rounded-full bg-primary shadow-[0_0_24px_hsl(var(--primary))]" />
            </div>
          </div>
          <div className="orbit-spin-reverse absolute inset-0 h-[640px] w-[640px] rounded-full border border-primary/10">
            <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="h-2 w-2 rounded-full bg-primary/70" />
            </div>
          </div>
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:py-32">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
            {/* LEFT: Text */}
            <div>
              <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5">
                <span className="signal-pulse h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
                <span className="caret-blink text-[11px] font-medium uppercase tracking-[0.15em] text-primary">
                  Red satelital activa · Venezuela
                </span>
              </div>
              <h1 className="animate-fade-up-delay-1 mt-5 font-display text-[42px] font-semibold leading-[0.95] tracking-[-0.03em] sm:text-6xl lg:text-7xl">
                Internet desde el espacio.
                <br />
                <span className="text-shimmer bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent">
                  En cualquier rincón
                </span>{" "}
                del país.
              </h1>
              <p className="animate-fade-up-delay-2 mt-6 max-w-xl text-[15px] leading-relaxed text-muted-foreground sm:text-base">
                Velocidades de 50 a 250 Mbps por satélite. Conecta donde no llega la fibra: fincas, costas, montañas, zonas rurales y ciudades.
                Instalación profesional en minutos. Soporte local en Venezuela.
              </p>

              <div className="animate-fade-up-delay-3 mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <Link href="/solicitud-activacion" className="w-full sm:w-auto">
                  <Button className="group h-[3.25rem] w-full px-7 text-[14px] font-semibold pulse-glow sm:w-auto">
                    Contratar un plan y pagar mensualidad
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </Link>
                <a href={waInfo} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                  <Button
                    className="group h-[3.25rem] w-full gap-2 bg-emerald-500 px-7 text-[14px] font-semibold text-white shadow-[0_0_24px_-6px_rgba(16,185,129,0.55)] hover:bg-emerald-600 hover:shadow-[0_0_32px_-4px_rgba(16,185,129,0.7)] sm:w-auto"
                  >
                    <MessageCircle className="h-5 w-5" />
                    Contáctanos por WhatsApp
                  </Button>
                </a>
                <Link href={portalHref} className="w-full sm:w-auto">
                  <Button variant="outline" className="h-[3.25rem] w-full px-7 text-[14px] sm:w-auto">
                    {portalLabel}
                  </Button>
                </Link>
              </div>
            </div>

            {/* RIGHT: Hero image with overlay */}
            <div className="animate-fade-up-delay-3 relative mx-auto w-full max-w-[480px] lg:max-w-none">
              <div className="float-slow relative aspect-[4/5] overflow-hidden rounded-3xl border border-border bg-card shadow-[0_30px_80px_-20px_hsl(var(--primary)/0.45)] glow-ring image-grain">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://loremflickr.com/720/900/merida,andes,venezuela?lock=11"
                  alt="Paisaje de Mérida y los Andes venezolanos conectados por Starlink"
                  loading="eager"
                  className="h-full w-full object-cover"
                />
                <div className="vignette absolute inset-0" />
                <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-background via-background/60 to-transparent" />

                {/* Top-left: signal indicator */}
                <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-3 py-1.5 backdrop-blur-md">
                  <span className="signal-pulse h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
                  <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-white">
                    Mérida, VE · 187 Mbps
                  </span>
                </div>

                {/* Vertical satellite beam */}
                <div className="beam-down absolute left-1/2 top-0 h-1/2 -translate-x-1/2" />
                <div className="beam-down absolute left-[35%] top-0 h-2/5 -translate-x-1/2" style={{ animationDelay: "0.8s" }} />

                {/* Bottom-left: tech card */}
                <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/15 bg-black/45 p-4 backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/25 ring-1 ring-primary/50">
                      <Satellite className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[10px] font-medium uppercase tracking-[0.15em] text-white/70">Latencia</div>
                      <div className="font-display text-lg font-semibold text-white">38 ms</div>
                    </div>
                    <div className="h-8 w-px bg-white/20" />
                    <div className="flex-1">
                      <div className="text-[10px] font-medium uppercase tracking-[0.15em] text-white/70">Uptime</div>
                      <div className="font-display text-lg font-semibold text-white">99.9%</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating mini card */}
              <div className="float-slower absolute -left-4 top-1/3 hidden rounded-2xl border border-border bg-card/90 p-3 shadow-2xl backdrop-blur-md sm:block">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 ring-1 ring-emerald-500/40">
                    <Signal className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div>
                    <div className="text-[9px] font-medium uppercase tracking-[0.15em] text-muted-foreground">Señal</div>
                    <div className="text-[12px] font-semibold">Excelente</div>
                  </div>
                </div>
              </div>

              <div className="float-slow absolute -right-3 bottom-1/4 hidden rounded-2xl border border-border bg-card/90 p-3 shadow-2xl backdrop-blur-md sm:block">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/40">
                    <Globe className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-[9px] font-medium uppercase tracking-[0.15em] text-muted-foreground">Cobertura</div>
                    <div className="text-[12px] font-semibold">100% nacional</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats bar */}
          <div className="mt-16 grid grid-cols-2 gap-0 border-y border-border sm:mt-20 sm:grid-cols-4">
            {[
              { label: "Velocidad", value: "50–250", unit: "Mbps" },
              { label: "Latencia", value: "<50", unit: "ms" },
              { label: "Cobertura", value: "100%", unit: "país" },
              { label: "Instalación", value: "<30", unit: "min" },
            ].map((s, i) => (
              <div
                key={s.label}
                className={`py-5 sm:py-6 ${i > 0 ? "border-l border-border sm:border-l" : ""} ${i === 2 ? "border-l-0 sm:border-l" : ""} ${i === 1 || i === 3 ? "" : ""} ${i >= 2 ? "border-t border-border sm:border-t-0" : ""}`}
              >
                <div className="eyebrow">{s.label}</div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{s.value}</span>
                  <span className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">{s.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ TRUST STRIP ============ */}
      <section className="border-b border-border bg-card/40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 py-6 sm:grid-cols-4 sm:py-7">
            {[
              { icon: BadgeCheck, label: "Proveedor autorizado" },
              { icon: ShieldCheck, label: "Garantía oficial" },
              { icon: HeadphonesIcon, label: "Soporte local 24/7" },
              { icon: Lock, label: "Pagos seguros en USD" },
            ].map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.label} className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4 flex-shrink-0 text-primary" />
                  <span className="text-[12px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                    {b.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ TODA VENEZUELA CONECTADA ============ */}
      <section id="historias" className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 radial-glow-bottom" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="mb-12 max-w-2xl">
            <div className="eyebrow">Toda Venezuela conectada</div>
            <h2 className="mt-2 font-display text-3xl font-semibold leading-tight tracking-[-0.02em] sm:text-4xl">
              Donde antes no había señal,{" "}
              <span className="text-shimmer bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent">
                ahora hay vida digital.
              </span>
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
              De los Andes a la Gran Sabana, de Los Roques a los Llanos. Familias, profesionales y empresas que dejaron de depender de la geografía para conectarse.
            </p>
          </div>

          <div className="stagger grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12">
            {/* Card 1: Big — Gran Sabana / Roraima */}
            <div className="group relative hover-lift aspect-[4/5] overflow-hidden rounded-3xl border border-border bg-card shadow-xl image-grain lg:col-span-5 lg:row-span-2 lg:aspect-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://loremflickr.com/900/1200/roraima,gran-sabana,venezuela?lock=21"
                alt="Tepui Roraima en la Gran Sabana, Venezuela"
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <div className="flex items-center gap-2">
                  <span className="signal-pulse h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
                  <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-white/85">Gran Sabana · Bolívar</span>
                </div>
                <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  La Gran Sabana, en línea.
                </h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-white/80">
                  Comunidades, posadas y operaciones turísticas en el sur del país conectadas a la red satelital. Donde antes el silencio era total.
                </p>
              </div>
            </div>

            {/* Card 2: Mérida / Andes */}
            <div className="group relative hover-lift aspect-[4/3] overflow-hidden rounded-3xl border border-border bg-card shadow-xl image-grain lg:col-span-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://loremflickr.com/800/600/merida,andes,venezuela?lock=14"
                alt="Andes venezolanos en Mérida"
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <div className="text-[10px] font-medium uppercase tracking-[0.15em] text-white/70">Mérida · Andes</div>
                <h3 className="mt-1 font-display text-lg font-semibold tracking-tight text-white">Pueblos de altura</h3>
                <p className="mt-1 text-[12.5px] leading-relaxed text-white/80">Páramos y zonas de difícil acceso, ahora con video en HD.</p>
              </div>
            </div>

            {/* Card 3: Los Roques */}
            <div className="group relative hover-lift aspect-[4/3] overflow-hidden rounded-3xl border border-border bg-card shadow-xl image-grain lg:col-span-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://loremflickr.com/600/450/los-roques,venezuela,playa?lock=33"
                alt="Archipiélago Los Roques, Venezuela"
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <div className="text-[10px] font-medium uppercase tracking-[0.15em] text-white/70">Los Roques</div>
                <h3 className="mt-1 font-display text-lg font-semibold tracking-tight text-white">Caribe conectado</h3>
                <p className="mt-1 text-[12.5px] leading-relaxed text-white/80">Posadas y embarcaciones en el archipiélago.</p>
              </div>
            </div>

            {/* Card 4: Llanos */}
            <div className="group relative hover-lift aspect-[4/3] overflow-hidden rounded-3xl border border-border bg-card shadow-xl image-grain lg:col-span-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://loremflickr.com/800/600/llanos,venezuela,apure?lock=42"
                alt="Llanos venezolanos al atardecer"
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <div className="text-[10px] font-medium uppercase tracking-[0.15em] text-white/70">Llanos · Apure · Guárico</div>
                <h3 className="mt-1 font-display text-lg font-semibold tracking-tight text-white">Hatos y agroindustria</h3>
                <p className="mt-1 text-[12.5px] leading-relaxed text-white/80">Producción y monitoreo desde el llano abierto.</p>
              </div>
            </div>

            {/* Card 5: Caracas / ciudades */}
            <div className="group relative hover-lift aspect-[4/3] overflow-hidden rounded-3xl border border-border bg-card shadow-xl image-grain lg:col-span-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://loremflickr.com/600/450/caracas,venezuela,ciudad?lock=55"
                alt="Caracas, capital de Venezuela"
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <div className="text-[10px] font-medium uppercase tracking-[0.15em] text-white/70">Caracas · Valencia · Maracaibo</div>
                <h3 className="mt-1 font-display text-lg font-semibold tracking-tight text-white">Ciudades</h3>
                <p className="mt-1 text-[12.5px] leading-relaxed text-white/80">Empresas, oficinas y comercios sin caídas.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ YA TENGO ANTENA ============ */}
      <section id="ya-tengo-antena" className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 radial-glow-bottom" />
        <div className="grid-bg absolute inset-0 opacity-20" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <div className="eyebrow">Clientes con equipo</div>
              <h2 className="mt-3 font-display text-4xl font-semibold leading-tight tracking-[-0.02em] sm:text-5xl">
                Ya tengo una antena, <span className="text-primary">solo quiero contratar un plan.</span>
              </h2>
              <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-muted-foreground sm:text-[17px]">
                Si ya tienes tu kit Starlink, contrata tu plan en minutos: completa un formulario corto con tus datos y el
                ID de tu antena, elige el plan, y adjunta el comprobante de pago. Un asesor valida y activa el servicio.
              </p>

              <ul className="mt-6 space-y-2.5 text-[14px] text-muted-foreground">
                {[
                  "Formulario rápido: datos de contacto + ID de antena",
                  "Elige el plan y te mostramos el monto exacto en USD",
                  "Sube la foto del comprobante (Zelle, PayPal, Binance, etc.)",
                  "Nuestro equipo te confirma y activa en horas hábiles",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link href="/solicitud-activacion" className="w-full sm:w-auto">
                  <Button className="group h-[3.25rem] w-full px-7 text-[14px] sm:w-auto">
                    Contratar un plan
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </Link>
                <a href={waInfo} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    className="h-[3.25rem] w-full gap-2 border-emerald-500/40 px-7 text-[14px] text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 sm:w-auto"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Consultar por WhatsApp
                  </Button>
                </a>
              </div>
            </div>

            <div className="relative">
              <div className="relative rounded-sm border border-border bg-card/80 p-7 shadow-[0_0_40px_-20px_hsl(var(--primary))]">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-primary/10 ring-1 ring-primary/30">
                    <Radio className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="eyebrow">3 pasos</div>
                    <div className="font-display text-lg font-semibold tracking-tight">Así de simple</div>
                  </div>
                </div>
                <ol className="mt-6 space-y-4">
                  {[
                    { t: "Tus datos y el ID de tu antena", d: "Nombre, correo, teléfono y el ID Starlink." },
                    { t: "Elige el plan que prefieras", d: "Te mostramos el monto exacto a pagar." },
                    { t: "Sube el comprobante de pago", d: "Foto del Zelle, PayPal, Binance o transferencia." },
                  ].map((s, i) => (
                    <li key={s.t} className="flex gap-3">
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-sm bg-primary/15 text-[12px] font-semibold text-primary ring-1 ring-primary/30">
                        {i + 1}
                      </div>
                      <div>
                        <div className="text-[14px] font-medium">{s.t}</div>
                        <div className="text-[13px] text-muted-foreground">{s.d}</div>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ PLANES ============ */}
      <section id="planes" className="relative border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="mb-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="eyebrow">Planes disponibles</div>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                Conexión para cada necesidad.
              </h2>
              <p className="mt-3 max-w-xl text-sm text-muted-foreground">
                Desde uso doméstico hasta empresarial. Todos incluyen soporte local, sin letra chica, con precios en USD.
              </p>
            </div>
          </div>

          {plans.length === 0 ? (
            <div className="rounded-sm border border-border bg-card p-10 text-center text-sm text-muted-foreground">
              Pronto publicaremos nuestros planes. Escríbenos por WhatsApp para recibir información personalizada.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((p, idx) => {
                const featured = idx === Math.min(1, plans.length - 1);
                const bullets = (p.details ?? "").split("\n").map((s) => s.trim()).filter(Boolean);
                const waPlan = waLink(
                  whatsapp,
                  `Hola 👋 Me interesa el plan *${p.name}* (${formatUSD(Number(p.price))}${BILLING_LABEL[p.billingCycle] ?? ""}). ¿Podrían darme más información?`,
                );
                return (
                  <div
                    key={p.id}
                    className={`relative flex flex-col rounded-sm border p-6 transition-all ${
                      featured
                        ? "border-primary/50 bg-gradient-to-b from-primary/10 to-card shadow-[0_0_40px_-15px_hsl(var(--primary))]"
                        : "border-border bg-card hover:border-border/60"
                    }`}
                  >
                    {featured && (
                      <div className="absolute -top-2 right-4 rounded-sm bg-primary px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.15em] text-primary-foreground">
                        Más elegido
                      </div>
                    )}
                    <div className="eyebrow">{p.code}</div>
                    <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight">{p.name}</h3>
                    {p.description && <p className="mt-2 text-[13px] text-muted-foreground">{p.description}</p>}

                    <div className="mt-5 flex items-baseline gap-2">
                      <span className="font-display text-4xl font-semibold tracking-tight text-foreground">
                        {formatUSD(Number(p.price))}
                      </span>
                      <span className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                        {BILLING_LABEL[p.billingCycle] ?? ""}
                      </span>
                    </div>

                    {bullets.length > 0 && (
                      <ul className="mt-6 space-y-2">
                        {bullets.map((b, i) => (
                          <li key={i} className="flex items-start gap-2 text-[13px] text-muted-foreground">
                            <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="mt-auto pt-6">
                      <a href={waPlan} target="_blank" rel="noopener noreferrer">
                        <Button className={`w-full ${featured ? "" : "bg-foreground text-background hover:bg-foreground/90"}`}>
                          Quiero este plan
                          <ArrowRight className="ml-1.5 h-4 w-4" />
                        </Button>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ============ EQUIPOS ============ */}
      <section id="equipos" className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 radial-glow-bottom" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="mb-10">
            <div className="eyebrow">Equipos Starlink</div>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Hardware oficial. Instalación profesional.
            </h2>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground">
              Kits y accesorios originales. Garantía incluida. Disponibles para entrega e instalación en todo el territorio nacional.
            </p>
          </div>

          {products.length === 0 ? (
            <div className="rounded-sm border border-border bg-card p-10 text-center text-sm text-muted-foreground">
              Pronto publicaremos nuestro inventario. Consulta disponibilidad por WhatsApp.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => {
                const waProd = waLink(
                  whatsapp,
                  `Hola 👋 Me interesa el equipo *${p.name}* (${formatUSD(Number(p.salePrice))}).`,
                );
                return (
                  <div key={p.id} className="group relative flex flex-col overflow-hidden rounded-sm border border-border bg-card transition-colors hover:border-border/60">
                    {/* Pseudo-imagen con gradient */}
                    <div className="relative flex h-40 items-center justify-center border-b border-border bg-gradient-to-br from-primary/15 via-background to-background">
                      <Satellite className="h-14 w-14 text-primary/50 transition-transform duration-500 group-hover:scale-110 group-hover:text-primary/80" />
                      <div className="grid-bg absolute inset-0 opacity-40" />
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <div className="eyebrow text-[10px]">{p.sku}</div>
                      <h3 className="mt-1 font-display text-lg font-semibold leading-tight tracking-tight">{p.name}</h3>
                      {p.features && (
                        <p className="mt-2 line-clamp-3 text-[12px] leading-relaxed text-muted-foreground">{p.features}</p>
                      )}
                      <div className="mt-auto pt-4 flex items-end justify-between border-t border-border">
                        <div>
                          <div className="eyebrow">Desde</div>
                          <div className="font-display text-xl font-semibold">{formatUSD(Number(p.salePrice))}</div>
                        </div>
                        <a href={waProd} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline" className="h-9 gap-1 px-3">
                            Consultar
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ============ SECTORES ============ */}
      <section id="sectores" className="relative border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-end">
            <div>
              <div className="eyebrow">Para quién es Starlink</div>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                Conectividad satelital pensada para cada sector.
              </h2>
            </div>
            <p className="text-[14px] leading-relaxed text-muted-foreground">
              Implementamos Starlink en hogares, empresas e industrias críticas en todo el territorio nacional.
              Desde una finca remota hasta una plataforma offshore: la misma red satelital, con asesoría y soporte adaptado a tu operación.
            </p>
          </div>

          <div className="stagger grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { icon: HomeIcon, label: "Residencial", sub: "Hogares y fincas" },
              { icon: Building2, label: "Empresas", sub: "Oficinas y comercios" },
              { icon: Mountain, label: "Zonas rurales", sub: "Donde no llega fibra" },
              { icon: Tractor, label: "Agroindustria", sub: "Fundos y haciendas" },
              { icon: Anchor, label: "Marítimo", sub: "Embarcaciones y costas" },
              { icon: Briefcase, label: "Industria", sub: "Petróleo, minería, gas" },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className="hover-lift group rounded-sm border border-border bg-card p-5 transition-all hover:border-primary/40"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-primary/10 ring-1 ring-primary/30 transition-colors group-hover:bg-primary/15">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="mt-4 font-display text-[15px] font-semibold tracking-tight">{s.label}</div>
                  <div className="mt-1 text-[12px] text-muted-foreground">{s.sub}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ ASESORÍAS ============ */}
      <section id="asesorias" className="relative overflow-hidden border-b border-border bg-card/40">
        <div className="absolute inset-0 radial-glow-bottom" />
        <div className="grid-bg absolute inset-0 opacity-20" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <div className="breathe inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-primary">Servicio premium</span>
            </div>
            <h2 className="mt-5 font-display text-3xl font-semibold leading-tight tracking-[-0.02em] sm:text-4xl lg:text-5xl">
              Asesorías <span className="text-primary">Starlink</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground sm:text-base">
              ¿Tu proyecto requiere algo más que una antena? Diseñamos, dimensionamos y operamos soluciones satelitales a la medida.
              Acompañamiento técnico de extremo a extremo, desde el diagnóstico hasta el soporte continuo.
            </p>
          </div>

          <div className="stagger mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Lightbulb,
                title: "Consultoría técnica",
                text: "Diagnóstico de cobertura, dimensionamiento de la solución y propuesta a medida según tu caso de uso, presupuesto y geografía.",
              },
              {
                icon: Network,
                title: "Diseño de red multi-sitio",
                text: "Arquitectura para múltiples ubicaciones con redundancia, balanceo y failover. Integración con tu red corporativa existente.",
              },
              {
                icon: Compass,
                title: "Análisis de cobertura",
                text: "Verificamos disponibilidad y rendimiento esperado en tu ubicación específica antes de comprar el equipo. Cero sorpresas.",
              },
              {
                icon: ClipboardCheck,
                title: "Instalación gestionada",
                text: "Visita técnica certificada, montaje, apuntamiento de la antena, configuración de la red local y entrega operativa.",
              },
              {
                icon: HeadphonesIcon,
                title: "Soporte gestionado 24/7",
                text: "Monitoreo proactivo del enlace, atención prioritaria por canales dedicados y SLA con tiempo de respuesta garantizado.",
              },
              {
                icon: Award,
                title: "Soluciones sectoriales",
                text: "Propuestas específicas para industria petrolera, agro, marítimo, gobierno y salud rural. Compliance y reportería incluida.",
              },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.title}
                  className="hover-lift group relative flex flex-col rounded-sm border border-border bg-card p-6 transition-colors hover:border-primary/40"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-sm bg-primary/10 ring-1 ring-primary/30">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="mt-5 font-display text-lg font-semibold tracking-tight">{s.title}</h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{s.text}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={waLink(whatsapp, "Hola 👋 Quisiera agendar una asesoría para mi proyecto Starlink.")}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto"
            >
              <Button className="h-[3.25rem] w-full gap-2 px-7 text-[14px] font-semibold sm:w-auto">
                <PhoneCall className="h-4 w-4" />
                Agendar una asesoría
              </Button>
            </a>
            <a href={`mailto:${email}?subject=Solicitud%20de%20asesor%C3%ADa%20Starlink`} className="w-full sm:w-auto">
              <Button variant="outline" className="h-[3.25rem] w-full px-7 text-[14px] sm:w-auto">
                Escribir por correo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ============ POR QUÉ ============ */}
      <section className="relative border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="mb-10">
            <div className="eyebrow">Por qué Starlink VE</div>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Una tecnología espacial. Una operación local.
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              {
                icon: Globe,
                title: "Cobertura nacional",
                text: "Satelital en cualquier rincón del país: desde Caracas a las comunidades más remotas del Zulia, Amazonas o Delta.",
              },
              {
                icon: Zap,
                title: "Velocidad real",
                text: "Sin throttling ni letras chicas. Velocidades de 50 a 250 Mbps y baja latencia para streaming, video, juegos y trabajo.",
              },
              {
                icon: ShieldCheck,
                title: "Soporte local",
                text: "Equipo venezolano atendiéndote por WhatsApp, Telegram o presencial. Visita técnica, reclamos de garantía y renovación sencilla.",
              },
              {
                icon: Signal,
                title: "Instalación profesional",
                text: "Técnicos certificados visitan tu sitio, apuntan la antena y dejan tu red funcionando. O elige el kit autoinstalable.",
              },
              {
                icon: MapPin,
                title: "Para empresas y rural",
                text: "Planes business con IP dedicada, planes Roam para movilidad, residencial ilimitado para el hogar.",
              },
              {
                icon: ShieldCheck,
                title: "Pagos transparentes",
                text: "Reportes de pago online, historial completo, recordatorios automáticos. Sin cargos sorpresa.",
              },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="rounded-sm border border-border bg-card p-5 transition-colors hover:border-border/60">
                  <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-primary/10 ring-1 ring-primary/30">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="mt-4 font-display text-base font-semibold tracking-tight">{f.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{f.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section id="faq" className="relative border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.5fr]">
            <div>
              <div className="eyebrow">Preguntas frecuentes</div>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                Resolvemos tus dudas.
              </h2>
              <p className="mt-4 max-w-md text-[14px] leading-relaxed text-muted-foreground">
                Lo que más nos preguntan antes de contratar. Si no está acá, escríbenos por WhatsApp y te respondemos en minutos.
              </p>
              <a href={waInfo} target="_blank" rel="noopener noreferrer" className="mt-6 inline-block">
                <Button variant="outline" className="h-11 gap-2 px-5 text-[13px]">
                  <MessageCircle className="h-4 w-4" />
                  Hacer una pregunta
                </Button>
              </a>
            </div>

            <div className="space-y-3">
              {[
                {
                  q: "¿Funciona Starlink en toda Venezuela?",
                  a: "Sí. La constelación cubre el 100% del territorio nacional, incluidas zonas rurales, costeras y montañosas donde no llega la fibra ni la red móvil. Antes de instalar, verificamos cobertura y línea de visión al cielo en tu ubicación específica.",
                },
                {
                  q: "¿Qué velocidad voy a tener?",
                  a: "Entre 50 y 250 Mbps de bajada según el plan, con latencia menor a 50 ms. Suficiente para video en HD/4K, videoconferencias, gaming online y trabajo remoto sin interrupciones.",
                },
                {
                  q: "¿Cuánto tarda la instalación?",
                  a: "El kit se autoinstala en menos de 30 minutos. Si prefieres instalación profesional, agendamos visita técnica certificada que monta, apunta la antena y deja la red local funcionando.",
                },
                {
                  q: "¿Hay límite de datos o throttling?",
                  a: "Los planes residenciales son de uso ilimitado en horas estándar. No aplicamos throttling artificial. Para empresas ofrecemos planes con prioridad garantizada.",
                },
                {
                  q: "¿Puedo cambiar o pausar mi plan?",
                  a: "Sí. Puedes subir o bajar de plan al inicio de cada ciclo, y pausar el servicio si te ausentas (ideal para clientes Roam, vacaciones o proyectos temporales).",
                },
                {
                  q: "¿Cómo se realiza el pago?",
                  a: "Aceptamos Zelle, PayPal, Binance, transferencia en USD, pago móvil al paralelo y efectivo en oficina. Cada cliente tiene un portal con historial de pagos y comprobantes.",
                },
                {
                  q: "¿Qué garantía tienen los equipos?",
                  a: "Garantía oficial Starlink de 12 meses por defectos de fábrica. Adicionalmente damos respaldo local: si tienes una falla, traes el equipo y lo gestionamos directamente.",
                },
              ].map((item) => (
                <details
                  key={item.q}
                  className="group rounded-sm border border-border bg-card transition-colors open:border-primary/40 hover:border-border/60"
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 text-[14px] font-medium [&::-webkit-details-marker]:hidden">
                    <span>{item.q}</span>
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-transform group-open:rotate-45">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M6 1V11M1 6H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </span>
                  </summary>
                  <div className="px-5 pb-5 text-[13.5px] leading-relaxed text-muted-foreground">
                    {item.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 radial-glow" />
        <div className="grid-bg absolute inset-0 opacity-30" />
        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
            ¿Listo para conectar?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] text-muted-foreground sm:text-base">
            Escríbenos por WhatsApp, cuéntanos tu ubicación y te armamos una propuesta en minutos. Sin compromiso.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href={waInfo} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
              <Button className="h-12 w-full gap-2 bg-emerald-500 px-6 text-[13px] text-white hover:bg-emerald-600 sm:w-auto">
                <MessageCircle className="h-4 w-4" />
                Hablar por WhatsApp
              </Button>
            </a>
            <Link href={portalHref} className="w-full sm:w-auto">
              <Button variant="outline" className="h-12 w-full px-6 text-[13px] sm:w-auto">
                {portalLabel}
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="border-t border-border bg-background">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-primary/15 ring-1 ring-primary/40">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                </div>
                <span className="font-display text-[13px] font-semibold uppercase tracking-[0.22em]">Starlink · Venezuela</span>
              </div>
              <p className="mt-3 max-w-sm text-[12px] text-muted-foreground">
                Proveedor autorizado de internet satelital Starlink en Venezuela. Kit, plan, instalación y soporte.
              </p>
            </div>

            <div className="flex flex-col gap-2 text-[12px]">
              <div className="eyebrow mb-1">Contacto</div>
              <a href={waInfo} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
                <MessageCircle className="h-3.5 w-3.5" />
                {whatsapp}
              </a>
              <a
                href={`https://instagram.com/${instagram.replace(/^@/, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <Instagram className="h-3.5 w-3.5" />
                @{instagram.replace(/^@/, "")}
              </a>
              <a href={`mailto:${email}`} className="text-muted-foreground hover:text-foreground">
                {email}
              </a>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {city}
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 border-t border-border pt-6 text-[11px] uppercase tracking-[0.15em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <div>© {new Date().getFullYear()} Starlink Venezuela. Todos los derechos reservados.</div>
            <div className="flex items-center gap-4">
              <Link href={portalHref} className="hover:text-foreground">
                {portalLabel}
              </Link>
              <span className="text-border">·</span>
              <a href={waInfo} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
                Soporte
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
