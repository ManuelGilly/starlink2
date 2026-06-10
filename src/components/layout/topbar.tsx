"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { ChevronRight } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { breadcrumbFor } from "@/components/layout/nav-items";

export function Topbar({ title, eyebrow }: { title: string; eyebrow?: string }) {
  const { data } = useSession();
  const pathname = usePathname();
  const roles = data?.user?.roles ?? [];
  const crumb = breadcrumbFor(pathname ?? "");

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/80 px-8 backdrop-blur-md">
      <div className="min-w-0">
        {crumb ? (
          <nav className="mb-0.5 flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {crumb.section && (
              <>
                <span>{crumb.section}</span>
                <ChevronRight className="h-3 w-3 opacity-60" />
              </>
            )}
            {crumb.isDetail ? (
              <Link href={crumb.href} className="transition-colors hover:text-foreground">
                {crumb.label}
              </Link>
            ) : (
              <span className="text-foreground/80">{crumb.label}</span>
            )}
          </nav>
        ) : (
          eyebrow && <div className="eyebrow mb-0.5">{eyebrow}</div>
        )}
        <h1 className="truncate font-display text-xl font-semibold tracking-tight">{title}</h1>
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
