"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { LogOut, ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ThemeSegments } from "@/components/theme-toggle";
import { NAV_ITEMS as ITEMS } from "@/components/layout/nav-items";

export function Sidebar() {
  const { data } = useSession();
  const pathname = usePathname();
  const roles = data?.user?.roles ?? [];

  const items = ITEMS.filter((i) => i.roles.some((r) => roles.includes(r as any)));
  const sections = Array.from(new Set(items.map((i) => i.section ?? "—")));

  // Sección que contiene la ruta actual (se abre por defecto).
  const activeSection =
    items.find((i) => pathname === i.href || pathname.startsWith(i.href + "/"))?.section ?? sections[0];
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const isOpen = (s: string) => overrides[s] ?? s === activeSection;
  const toggle = (s: string) => setOverrides((p) => ({ ...p, [s]: !isOpen(s) }));

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

      {/* Navegación por secciones colapsables */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {sections.map((section) => {
          const open = isOpen(section);
          const sectionItems = items.filter((i) => (i.section ?? "—") === section);
          return (
            <div key={section}>
              <button
                type="button"
                onClick={() => toggle(section)}
                className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground/70 transition-colors hover:text-foreground"
              >
                <span>{section}</span>
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open ? "" : "-rotate-90")} />
              </button>
              {open && (
                <div className="mt-0.5 space-y-0.5 pb-1">
                  {sectionItems.map((item) => {
                    const Icon = item.icon;
                    const active = pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "group flex items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm transition-colors",
                          active
                            ? "bg-primary/10 font-medium text-primary"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground",
                        )}
                      >
                        <Icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
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
