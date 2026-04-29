"use client";

import { useSession } from "next-auth/react";
import { ThemeToggle } from "@/components/theme-toggle";

export function Topbar({ title, eyebrow }: { title: string; eyebrow?: string }) {
  const { data } = useSession();
  const roles = data?.user?.roles ?? [];
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/80 px-8 backdrop-blur-md">
      <div>
        {eyebrow && <div className="eyebrow mb-0.5">{eyebrow}</div>}
        <h1 className="font-display text-xl font-semibold tracking-tight">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground md:flex">
          {roles.map((r) => (
            <span key={r} className="rounded-sm border border-border px-2 py-1">{r}</span>
          ))}
        </div>
        <ThemeToggle />
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-[13px] font-semibold text-primary ring-1 ring-primary/30">
          {(data?.user?.name ?? "?").slice(0, 1).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
