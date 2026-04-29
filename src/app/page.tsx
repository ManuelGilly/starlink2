import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Globe,
  Instagram,
  MapPin,
  MessageCircle,
  Radio,
  Satellite,
  ShieldCheck,
  Signal,
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
        <div className="absolute inset-0 radial-glow" />
        <div className="grid-bg absolute inset-0 opacity-40" />
        <div className="noise absolute inset-0" />

        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:py-36">
          <div className="animate-fade-up eyebrow">Internet satelital · Venezuela</div>
          <h1 className="animate-fade-up-delay-1 mt-5 font-display text-[40px] font-semibold leading-[0.95] tracking-[-0.03em] sm:text-6xl lg:text-7xl">
            Internet desde el espacio.
            <br />
            <span className="text-primary">En cualquier rincón</span> del país.
          </h1>
          <p className="animate-fade-up-delay-2 mt-6 max-w-xl text-[15px] leading-relaxed text-muted-foreground sm:text-base">
            Velocidades de 50 a 250 Mbps por satélite. Conecta donde no llega la fibra: fincas, costas, montañas, zonas rurales y ciudades.
            Instalación profesional en minutos. Soporte local en Venezuela.
          </p>

          <div className="animate-fade-up-delay-3 mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href={portalHref} className="w-full sm:w-auto">
              <Button className="group h-12 w-full px-6 text-[13px] sm:w-auto">
                {portalLabel}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
            <a href={waInfo} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
              <Button variant="outline" className="h-12 w-full gap-2 border-emerald-500/40 px-6 text-[13px] text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 sm:w-auto">
                <MessageCircle className="h-4 w-4" />
                Contáctanos por WhatsApp
              </Button>
            </a>
          </div>

          {/* Stats bar */}
          <div className="mt-14 grid grid-cols-2 gap-0 border-y border-border sm:grid-cols-4">
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

      {/* ============ YA TENGO ANTENA ============ */}
      <section id="ya-tengo-antena" className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 radial-glow-bottom" />
        <div className="grid-bg absolute inset-0 opacity-20" />
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <div className="eyebrow">Clientes con equipo</div>
              <h2 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-[-0.02em] sm:text-4xl">
                Ya tengo una antena, <span className="text-primary">solo quiero contratar un plan.</span>
              </h2>
              <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
                Si ya tienes tu kit Starlink, contrata tu plan en minutos: completa un formulario corto con tus datos y el
                ID de tu antena, elige el plan, y adjunta el comprobante de pago. Un asesor valida y activa el servicio.
              </p>

              <ul className="mt-5 space-y-2 text-[13px] text-muted-foreground">
                {[
                  "Formulario rápido: datos de contacto + ID de antena",
                  "Elige el plan y te mostramos el monto exacto en USD",
                  "Sube la foto del comprobante (Zelle, PayPal, Binance, etc.)",
                  "Nuestro equipo te confirma y activa en horas hábiles",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link href="/solicitud-activacion" className="w-full sm:w-auto">
                  <Button className="group h-12 w-full px-6 text-[13px] sm:w-auto">
                    Contratar un plan
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </Link>
                <a href={waInfo} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    className="h-12 w-full gap-2 border-emerald-500/40 px-6 text-[13px] text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 sm:w-auto"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Consultar por WhatsApp
                  </Button>
                </a>
              </div>
            </div>

            <div className="relative">
              <div className="relative rounded-sm border border-border bg-card/80 p-6 shadow-[0_0_40px_-20px_hsl(var(--primary))]">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-primary/10 ring-1 ring-primary/30">
                    <Radio className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="eyebrow">3 pasos</div>
                    <div className="font-display text-base font-semibold tracking-tight">Así de simple</div>
                  </div>
                </div>
                <ol className="mt-5 space-y-4">
                  {[
                    { t: "Tus datos y el ID de tu antena", d: "Nombre, correo, teléfono y el ID Starlink." },
                    { t: "Elige el plan que prefieras", d: "Te mostramos el monto exacto a pagar." },
                    { t: "Sube el comprobante de pago", d: "Foto del Zelle, PayPal, Binance o transferencia." },
                  ].map((s, i) => (
                    <li key={s.t} className="flex gap-3">
                      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-sm bg-primary/15 text-[11px] font-semibold text-primary ring-1 ring-primary/30">
                        {i + 1}
                      </div>
                      <div>
                        <div className="text-[13px] font-medium">{s.t}</div>
                        <div className="text-[12px] text-muted-foreground">{s.d}</div>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
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
