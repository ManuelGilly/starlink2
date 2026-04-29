"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, CheckCircle2, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Plan = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  details: string | null;
  price: number;
  billingCycle: "MONTHLY" | "YEARLY" | "ONE_TIME";
};

const BILLING_LABEL: Record<Plan["billingCycle"], string> = {
  MONTHLY: "/ mes",
  YEARLY: "/ año",
  ONE_TIME: "pago único",
};

const METHODS = [
  { value: "ZELLE", label: "Zelle" },
  { value: "PAYPAL", label: "PayPal" },
  { value: "BINANCE", label: "Binance Pay" },
  { value: "TRANSFERENCIA_USD", label: "Transferencia USD" },
  { value: "EFECTIVO_USD", label: "Efectivo USD" },
  { value: "OTRO", label: "Otro" },
] as const;

const MAX_FILE_MB = 8;
const ACCEPT_MIME = "image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,application/pdf";

function formatUSD(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export function SolicitudActivacionForm({ plans }: { plans: Plan[] }) {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [antennaId, setAntennaId] = useState("");
  const [planId, setPlanId] = useState<string>(plans[0]?.id ?? "");
  const [paymentMethod, setPaymentMethod] = useState<(typeof METHODS)[number]["value"]>("ZELLE");
  const [paymentReference, setPaymentReference] = useState("");
  const [notes, setNotes] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const selected = useMemo(() => plans.find((p) => p.id === planId) ?? null, [plans, planId]);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (!f) return setReceipt(null);
    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`El archivo excede ${MAX_FILE_MB} MB`);
      e.target.value = "";
      return;
    }
    setReceipt(f);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return toast.error("Selecciona un plan");
    if (!receipt) return toast.error("Adjunta el comprobante de pago");

    const fd = new FormData();
    fd.set("firstName", firstName.trim());
    fd.set("lastName", lastName.trim());
    fd.set("email", email.trim());
    fd.set("phone", phone.trim());
    fd.set("antennaId", antennaId.trim());
    fd.set("planId", selected.id);
    fd.set("paymentMethod", paymentMethod);
    if (paymentReference.trim()) fd.set("paymentReference", paymentReference.trim());
    if (notes.trim()) fd.set("notes", notes.trim());
    fd.set("receipt", receipt);

    setLoading(true);
    try {
      const res = await fetch("/api/solicitud-activacion", { method: "POST", body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "No pudimos registrar la solicitud");
      }
      setDone(true);
      toast.success("Solicitud enviada. Te contactaremos pronto.");
    } catch (err: any) {
      toast.error(err?.message ?? "Error al enviar");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-sm border border-emerald-500/40 bg-emerald-500/5 p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/40">
          <CheckCircle2 className="h-6 w-6 text-emerald-400" />
        </div>
        <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight">¡Solicitud recibida!</h2>
        <p className="mx-auto mt-2 max-w-md text-[14px] text-muted-foreground">
          Un asesor validará tu comprobante y procederá a la activación. Te escribiremos al correo o WhatsApp que nos indicaste.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row">
          <Button onClick={() => router.push("/")} className="w-full sm:w-auto">
            Volver al inicio
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-10">
      {/* 1. Datos del cliente */}
      <section className="rounded-sm border border-border bg-card p-6">
        <div className="flex items-center gap-3">
          <StepBadge n={1} />
          <h2 className="font-display text-lg font-semibold tracking-tight">Tus datos</h2>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="firstName">Nombre</Label>
            <Input id="firstName" required maxLength={80} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="lastName">Apellido</Label>
            <Input id="lastName" required maxLength={80} value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="email">Correo electrónico</Label>
            <Input id="email" type="email" required maxLength={160} value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="phone">Teléfono / WhatsApp</Label>
            <Input id="phone" type="tel" required placeholder="+58 414 1234567" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="antennaId">ID de tu antena Starlink</Label>
            <Input
              id="antennaId"
              required
              value={antennaId}
              onChange={(e) => setAntennaId(e.target.value)}
              placeholder="p. ej. KIT-00123456 o Service Line ID"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Encuéntralo en la app Starlink → Configuración → Kit, o en tu cuenta Starlink bajo "Service Line".
            </p>
          </div>
        </div>
      </section>

      {/* 2. Selección de plan */}
      <section className="rounded-sm border border-border bg-card p-6">
        <div className="flex items-center gap-3">
          <StepBadge n={2} />
          <h2 className="font-display text-lg font-semibold tracking-tight">Elige tu plan</h2>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {plans.map((p) => {
            const active = planId === p.id;
            return (
              <button
                type="button"
                key={p.id}
                onClick={() => setPlanId(p.id)}
                className={[
                  "relative flex flex-col rounded-sm border p-4 text-left transition-all",
                  active
                    ? "border-primary/60 bg-primary/5 shadow-[0_0_30px_-18px_hsl(var(--primary))]"
                    : "border-border bg-background hover:border-border/60",
                ].join(" ")}
              >
                {active && (
                  <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-3 w-3" />
                  </div>
                )}
                <div className="eyebrow">{p.code}</div>
                <div className="mt-1 font-display text-base font-semibold tracking-tight">{p.name}</div>
                {p.description && <p className="mt-1 text-[12px] text-muted-foreground">{p.description}</p>}
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="font-display text-2xl font-semibold tracking-tight">{formatUSD(p.price)}</span>
                  <span className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                    {BILLING_LABEL[p.billingCycle]}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {selected && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-dashed border-border bg-background/60 px-4 py-3">
            <div className="text-[12px] uppercase tracking-[0.15em] text-muted-foreground">Monto a pagar</div>
            <div className="font-display text-2xl font-semibold tracking-tight">
              {formatUSD(selected.price)}{" "}
              <span className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                {BILLING_LABEL[selected.billingCycle]}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* 3. Comprobante */}
      <section className="rounded-sm border border-border bg-card p-6">
        <div className="flex items-center gap-3">
          <StepBadge n={3} />
          <h2 className="font-display text-lg font-semibold tracking-tight">Comprobante de pago</h2>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Método de pago</Label>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
            >
              {METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="reference">Referencia / # confirmación (opcional)</Label>
            <Input id="reference" value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="receipt">Foto del comprobante</Label>
            <label
              htmlFor="receipt"
              className="mt-1 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-sm border border-dashed border-border bg-background/60 p-6 text-center transition-colors hover:border-primary/60 hover:bg-primary/5"
            >
              <Upload className="h-5 w-5 text-muted-foreground" />
              <div className="text-[13px]">
                {receipt ? (
                  <span className="font-medium">{receipt.name}</span>
                ) : (
                  <>
                    <span className="font-medium">Haz clic para subir</span>{" "}
                    <span className="text-muted-foreground">o arrastra aquí</span>
                  </>
                )}
              </div>
              <div className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                JPG, PNG, WEBP, HEIC o PDF · máx. {MAX_FILE_MB} MB
              </div>
              <input
                id="receipt"
                type="file"
                accept={ACCEPT_MIME}
                className="hidden"
                onChange={onFileChange}
                required
              />
            </label>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
      </section>

      <div className="flex flex-col items-end gap-2">
        <Button type="submit" disabled={loading} className="h-11 w-full px-6 sm:w-auto">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando…
            </>
          ) : (
            <>Enviar solicitud</>
          )}
        </Button>
        <p className="text-[11px] text-muted-foreground">
          Al enviar aceptas que validemos tu información antes de activar el servicio.
        </p>
      </div>
    </form>
  );
}

function StepBadge({ n }: { n: number }) {
  return (
    <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-primary/15 text-[12px] font-semibold text-primary ring-1 ring-primary/30">
      {n}
    </div>
  );
}
