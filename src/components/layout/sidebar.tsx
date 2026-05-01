"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  BarChart3,
  Boxes,
  Package,
  Users,
  UserCog,
  Wallet,
  Warehouse,
  LogOut,
  Bell,
  CreditCard,
  ShieldCheck,
  FileText,
  Inbox,
  ShoppingCart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeSegments } from "@/components/theme-toggle";

type Item = { href: string; label: string; icon: React.ComponentType<{ className?: string }>; roles: string[]; section?: string };

const ITEMS: Item[] = [
  { href: "/dashboard",       label: "Dashboard",       icon: BarChart3,  roles: ["ADMIN", "INVENTARIO"], section: "Operación" },
  { href: "/productos",       label: "Productos",       icon: Package,    roles: ["ADMIN", "INVENTARIO"], section: "Operación" },
  { href: "/inventario",      label: "Inventario",      icon: Warehouse,  roles: ["ADMIN", "INVENTARIO"], section: "Operación" },
  { href: "/planes",          label: "Planes",          icon: Boxes,      roles: ["ADMIN", "INVENTARIO"], section: "Operación" },
  { href: "/clientes",        label: "Clientes",        icon: Users,      roles: ["ADMIN", "INVENTARIO"], section: "Operación" },
  { href: "/pagos",           label: "Pagos",           icon: Wallet,     roles: ["ADMIN"],               section: "Finanzas" },
  { href: "/ventas",          label: "Ventas",          icon: ShoppingCart, roles: ["ADMIN", "INVENTARIO"], section: "Finanzas" },
  { href: "/solicitudes-activacion", label: "Solicitudes", icon: Inbox,    roles: ["ADMIN"],               section: "Finanzas" },
  { href: "/usuarios",        label: "Usuarios",        icon: UserCog,    roles: ["ADMIN"],               section: "Sistema" },
  { href: "/notificaciones",  label: "Notificaciones",  icon: Bell,       roles: ["ADMIN"],               section: "Sistema" },
  { href: "/bitacora",        label: "Bitácora",        icon: FileText,   roles: ["ADMIN"],               section: "Sistema" },
  { href: "/mi-cuenta",       label: "Mi cuenta",       icon: CreditCard, roles: ["CLIENTE"],             section: "Cuenta" },
  { href: "/mi-cuenta/pagos", label: "Mis pagos",       icon: Wallet,     roles: ["CLIENTE"],             section: "Cuenta" },
  { href: "/mi-cuenta/garantias", label: "Garantías",   icon: ShieldCheck,roles: ["CLIENTE"],             section: "Cuenta" },
];

export function Sidebar() {
  const { data } = useSession();
  const pathname = usePathname();
  const roles = data?.user?.roles ?? [];

  const items = ITEMS.filter((i) => i.roles.some((r) => roles.includes(r as any)));
  const sections = Array.from(new Set(items.map((i) => i.section ?? "—")));

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-background">
      {/* Brand */}
      <div className="flex h-16 items-center border-b border-border px-5">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-primary/10 ring-1 ring-primary/40">
            <div className="h-2 w-2 rounded-full bg-primary" />
          </div>
          <span className="font-display text-sm font-semibold uppercase tracking-[0.22em]">
            Starlink
          </span>
          <span className="ml-1 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">VE</span>
        </Link>
      </div>

      {/* Navegación por secciones */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {sections.map((section) => (
          <div key={section} className="mb-6 last:mb-2">
            <div className="mb-2 px-2 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground/80">
              {section}
            </div>
            <div className="space-y-0.5">
              {items.filter((i) => (i.section ?? "—") === section).map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-2.5 rounded-sm px-2 py-2 text-[13px] font-medium uppercase tracking-[0.08em] transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer usuario */}
      <div className="border-t border-border p-3">
        <div className="mb-2 px-2">
          <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground/80">Tema</div>
          <ThemeSegments className="mb-3 w-full justify-between" />
          <div className="truncate text-[13px] font-medium">{data?.user?.name ?? "—"}</div>
          <div className="truncate text-[11px] text-muted-foreground">{data?.user?.email ?? ""}</div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:bg-accent hover:text-destructive"
        >
          <LogOut className="h-3.5 w-3.5" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
