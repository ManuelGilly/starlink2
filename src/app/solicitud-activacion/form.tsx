"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, CheckCircle2, Loader2, Mail, MapPin, Upload } from "lucide-react";
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

type Method = {
  code: string;
  label: string;
  accountEmail: string | null;
  accountInfo: string | null;
  commissionPct: number | null;
  requiresReceipt: boolean;
  showVesAmount: boolean;
  instructions: string | null;
};

const BILLING_LABEL: Record<Plan["billingCycle"], string> = {
  MONTHLY: "/ mes",
  YEARLY: "/ año",
  ONE_TIME: "pago único",
};

const MAX_FILE_MB = 8;
const ACCEPT_MIME = "image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,application/pdf";

function formatUSD(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}
function formatVES(n: number) {
  return new Intl.NumberFormat("es-VE", { style: "currency", currency: "VES", maximumFractionDigits: 2 }).format(n);
}

export function SolicitudActivacionForm({
  plans,
  methods,
  paraleloRate,
}: {
  plans: Plan[];
  methods: Method[];
  paraleloRate: number;
}) {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [antennaId, setAntennaId] = useState("");
  const [planId, setPlanId] = useState<string>(plans[0]?.id ?? "");
  const [paymentMethod, setPaymentMethod] = useState<string>(methods[0]?.code ?? "ZELLE");
  const [paymentReference, setPaymentReference] = useState("");
  const [notes, setNotes] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const selectedPlan = useMemo(() => plans.find((p) => p.id === planId) ?? null, [plans, planId]);
  const selectedMethod = useMemo(
    () => methods.find((m) => m.code === paymentMethod) ?? null,
    [methods, paymentMethod],
  );

  useEffect(() => {
    setReceiptError(null);
  }, [paymentMethod]);

  const totals = useMemo(() => {
    if (!selectedPlan || !selectedMethod) return null;
    const base = selectedPlan.price;
    const commission =
      selectedMethod.commissionPct && selectedMethod.commissionPct > 0
        ? base * (selectedMethod.commissionPct / 100)
        : 0;
    const totalUSD = base + commission;
    const totalVES = selectedMethod.showVesAmount && paraleloRate > 0 ? totalUSD * paraleloRate : null;
    return { base, commission, totalUSD, totalVES };
  }, [selectedPlan, selectedMethod, paraleloRate]);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (!f) return setReceipt(null);
    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`El archivo excede ${MAX_FILE_MB} MB`);
      e.target.value = "";
      return;
    }
    setReceiptError(null);
    setReceipt(f);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPlan) {
      toast.error("Selecciona un plan");
      return;
    }
    if (!selectedMethod) {
      toast.error("Selecciona un método de pago");
      return;
    }
    if (selectedMethod.requiresReceipt && !receipt) {
      setReceiptError("Adjunta el comprobante de pago para continuar.");
      toast.error("Falta el comprobante de pago");
      document.getElementById("receipt-section")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setReceiptError(null);

    const fd = new FormData();
    fd.set("firstName", firstName.trim());
    fd.set("lastName", lastName.trim());
    fd.set("email", email.trim());
    fd.set("phone", phone.trim());
    fd.set("antennaId", antennaId.trim());
    fd.set("planId", selectedPlan.id);
    fd.set("paymentMethod", selectedMethod.code);
    if (paymentReference.trim()) fd.set("paymentReference", paymentReference.trim());
    if (notes.trim()) fd.set("notes", notes.trim());
    if (receipt) fd.set("receipt", receipt);

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

  const requiresReceipt = selectedMethod?.requiresReceipt ?? true;

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
            <Label htmlFor="firstName">Nombre <span className="text-destructive">*</span></Label>
            <Input id="firstName" required maxLength={80} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="lastName">Apellido <span className="text-destructive">*</span></Label>
            <Input id="lastName" required maxLength={80} value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="email">Correo electrónico <span className="text-destructive">*</span></Label>
            <Input id="email" type="email" required maxLength={160} value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="phone">Teléfono / WhatsApp <span className="text-destructive">*</span></Label>
            <Input id="phone" type="tel" required placeholder="+58 414 1234567" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="antennaId">ID de tu antena Starlink <span className="text-destructive">*</span></Label>
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
      </section>

      {/* 3. Método y comprobante */}
      <section id="receipt-section" className="rounded-sm border border-border bg-card p-6">
        <div className="flex items-center gap-3">
          <StepBadge n={3} />
          <h2 className="font-display text-lg font-semibold tracking-tight">Método de pago y comprobante</h2>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <Label>Método de pago <span className="text-destructive">*</span></Label>
            {methods.length === 0 ? (
              <p className="mt-2 rounded-sm border border-destructive/40 bg-destructive/5 p-3 text-[13px] text-destructive">
                No hay métodos de pago activos. Contacta al administrador.
              </p>
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {methods.map((m) => {
                  const active = paymentMethod === m.code;
                  return (
                    <button
                      type="button"
                      key={m.code}
                      onClick={() => setPaymentMethod(m.code)}
                      className={[
                        "rounded-sm border px-3 py-2.5 text-left text-[13px] transition-colors",
                        active
                          ? "border-primary/60 bg-primary/5"
                          : "border-border bg-background hover:border-border/60",
                      ].join(" ")}
                    >
                      <div className="font-medium">{m.label}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {m.requiresReceipt ? "Requiere comprobante" : "Sin comprobante"}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detalle del método seleccionado */}
          {selectedMethod && totals && (
            <div className="rounded-sm border border-primary/30 bg-primary/5 p-4">
              <div className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                {selectedMethod.requiresReceipt ? "Datos para realizar el pago" : "Cómo pagar"}
              </div>

              {selectedMethod.accountEmail && (
                <div className="mt-2 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <span className="font-mono text-[14px] font-medium">{selectedMethod.accountEmail}</span>
                </div>
              )}
              {!selectedMethod.requiresReceipt && (
                <div className="mt-2 flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                  <span className="text-[14px] font-medium">Pago en persona — dirección de la empresa</span>
                </div>
              )}
              {selectedMethod.accountInfo && (
                <p className="mt-2 whitespace-pre-line text-[13px] text-muted-foreground">{selectedMethod.accountInfo}</p>
              )}

              <div className="mt-4 space-y-1 border-t border-border/60 pt-3 text-[13px]">
                <Row label="Monto del plan" value={formatUSD(totals.base)} />
                {totals.commission > 0 && (
                  <Row
                    label={`Comisión ${selectedMethod.label} (${selectedMethod.commissionPct}%)`}
                    value={`+ ${formatUSD(totals.commission)}`}
                  />
                )}
                <div className="flex items-baseline justify-between pt-1">
                  <span className="font-medium">Total a pagar</span>
                  <span className="font-display text-lg font-semibold">{formatUSD(totals.totalUSD)}</span>
                </div>
                {selectedMethod.showVesAmount && (
                  <div className="mt-2 rounded-sm border border-border/60 bg-background/60 p-3">
                    {paraleloRate > 0 && totals.totalVES !== null ? (
                      <>
                        <div className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                          Equivalente en bolívares (tasa Bs {paraleloRate.toFixed(2)} / USD)
                        </div>
                        <div className="mt-1 font-display text-lg font-semibold">{formatVES(totals.totalVES)}</div>
                      </>
                    ) : (
                      <div className="text-[12px] text-destructive">
                        La tasa Bs/USD no está configurada. Contacta al administrador.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Comprobante */}
          {requiresReceipt && (
            <>
              <div>
                <Label htmlFor="reference">Referencia / # confirmación (opcional)</Label>
                <Input id="reference" value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="receipt">
                  Foto del comprobante <span className="text-destructive">*</span>
                </Label>
                <label
                  htmlFor="receipt"
                  aria-invalid={!!receiptError}
                  className={[
                    "mt-1 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-sm border border-dashed bg-background/60 p-6 text-center transition-colors",
                    receiptError
                      ? "border-destructive/70 bg-destructive/5 hover:border-destructive"
                      : "border-border hover:border-primary/60 hover:bg-primary/5",
                  ].join(" ")}
                >
                  <Upload className={`h-5 w-5 ${receiptError ? "text-destructive" : "text-muted-foreground"}`} />
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
                  />
                </label>
                {receiptError && (
                  <p role="alert" className="mt-2 text-[12px] font-medium text-destructive">
                    {receiptError}
                  </p>
                )}
              </div>
            </>
          )}

          <div>
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}
