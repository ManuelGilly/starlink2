"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";

type Step = "credentials" | "needs-setup" | "code";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [chatId, setChatId] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function onCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/auth/login-step1", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setLoading(false);
      toast.error(data.error ?? "Credenciales inválidas");
      return;
    }
    if (data.requires2fa === false) {
      const signRes = await signIn("credentials", { email, password, redirect: false });
      setLoading(false);
      if (signRes?.error) return toast.error("Credenciales inválidas");
      router.replace("/");
      router.refresh();
      return;
    }
    setLoading(false);
    setChallengeToken(data.challengeToken);
    if (data.needsTelegramSetup) {
      setStep("needs-setup");
    } else if (data.requires2fa) {
      toast.success("Te enviamos un código por Telegram");
      setStep("code");
    }
  }

  async function onTelegramSetup(e: React.FormEvent) {
    e.preventDefault();
    if (!challengeToken) return;
    setLoading(true);
    const res = await fetch("/api/auth/telegram-setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeToken, telegramChatId: chatId.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      toast.error(typeof data.error === "string" ? data.error : "No se pudo vincular el chat");
      return;
    }
    setChallengeToken(data.challengeToken);
    toast.success("Chat vinculado. Te enviamos el código.");
    setStep("code");
  }

  async function onCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!challengeToken) return;
    setLoading(true);
    const res = await signIn("credentials", {
      challengeToken,
      code: code.trim(),
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      toast.error("Código inválido o expirado");
      return;
    }
    router.replace("/");
    router.refresh();
  }

  function backToCredentials() {
    setStep("credentials");
    setChallengeToken(null);
    setChatId("");
    setCode("");
  }

  return (
    <div className="relative grid min-h-screen lg:grid-cols-2">
      <div className="pointer-events-none absolute right-4 top-4 z-10 lg:right-6 lg:top-6">
        <div className="pointer-events-auto">
          <ThemeToggle />
        </div>
      </div>
      {/* Lado izquierdo — hero */}
      <div className="relative hidden overflow-hidden border-r border-border lg:block">
        <div className="grid-bg absolute inset-0 opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/70 to-primary/20" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-primary/15 ring-1 ring-primary/40">
              <div className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_18px_hsl(var(--primary))]" />
            </div>
            <span className="font-display text-sm font-semibold uppercase tracking-[0.3em]">Starlink · Venezuela</span>
          </div>

          <div>
            <div className="eyebrow mb-4">Panel de gestión</div>
            <h1 className="hero-title">
              Internet satelital,<br />
              gestión en tierra.
            </h1>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-muted-foreground">
              Administra productos, planes, clientes y pagos de Starlink Venezuela desde un único panel.
              Monitoreo de inventario, reportes de pago y notificaciones multicanal.
            </p>
          </div>

          <div className="flex items-center gap-6 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            <span>Residencial</span>
            <span className="h-px w-6 bg-border" />
            <span>Roam</span>
            <span className="h-px w-6 bg-border" />
            <span>Business</span>
          </div>
        </div>
      </div>

      {/* Lado derecho — formulario */}
      <div className="flex items-center justify-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-sm">
          <div className="mb-10 flex items-center gap-2 lg:hidden">
            <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-primary/15 ring-1 ring-primary/40">
              <div className="h-2 w-2 rounded-full bg-primary" />
            </div>
            <span className="font-display text-sm font-semibold uppercase tracking-[0.25em]">Starlink VE</span>
          </div>

          {step === "credentials" && (
            <>
              <div className="eyebrow mb-3">Acceso</div>
              <h2 className="mb-2 font-display text-3xl font-semibold tracking-tight">Inicia sesión</h2>
              <p className="mb-8 text-sm text-muted-foreground">
                Usa las credenciales enviadas a tu correo por el administrador.
              </p>

              <form onSubmit={onCredentialsSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Correo</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <Button type="submit" className="group w-full" disabled={loading}>
                  {loading ? "Verificando…" : "Continuar"}
                  {!loading && <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
                </Button>
              </form>
            </>
          )}

          {step === "needs-setup" && (
            <>
              <div className="eyebrow mb-3">Vincular Telegram</div>
              <h2 className="mb-2 font-display text-3xl font-semibold tracking-tight">Configura tu 2FA</h2>
              <p className="mb-6 text-sm text-muted-foreground">
                Para acceder al panel admin necesitás un chat de Telegram donde recibir el código de verificación.
              </p>
              <ol className="mb-6 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                <li>Abrí Telegram y escribile <span className="font-mono">/start</span> al bot del sistema.</li>
                <li>Escribile a <span className="font-mono">@userinfobot</span> para obtener tu chat ID numérico.</li>
                <li>Pegá ese chat ID acá abajo.</li>
              </ol>
              <form onSubmit={onTelegramSetup} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="chatId" className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Chat ID</Label>
                  <Input
                    id="chatId"
                    type="text"
                    inputMode="numeric"
                    required
                    value={chatId}
                    onChange={(e) => setChatId(e.target.value)}
                    placeholder="123456789"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? "Vinculando…" : "Vincular y enviar código"}
                  </Button>
                  <Button type="button" variant="outline" onClick={backToCredentials} disabled={loading}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </>
          )}

          {step === "code" && (
            <>
              <div className="eyebrow mb-3">Verificación</div>
              <h2 className="mb-2 font-display text-3xl font-semibold tracking-tight">Ingresá el código</h2>
              <p className="mb-8 text-sm text-muted-foreground">
                Te enviamos un código de 6 dígitos por Telegram. Vence en 5 minutos.
              </p>

              <form onSubmit={onCodeSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Código</Label>
                  <Input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                    maxLength={6}
                    pattern="\d{6}"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    className="text-center font-mono text-xl tracking-[0.4em]"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1" disabled={loading || code.length !== 6}>
                    {loading ? "Verificando…" : "Ingresar"}
                  </Button>
                  <Button type="button" variant="outline" onClick={backToCredentials} disabled={loading}>
                    Volver
                  </Button>
                </div>
              </form>
            </>
          )}

          <div className="mt-10 flex items-center justify-between border-t border-border pt-6 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            <a href="/" className="hover:text-foreground">← Inicio</a>
            <span>¿Olvidaste tu contraseña? Contacta al admin</span>
          </div>
        </div>
      </div>
    </div>
  );
}
