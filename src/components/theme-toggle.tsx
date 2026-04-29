"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme, type Theme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      title={isDark ? "Tema claro" : "Tema oscuro"}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-sm border border-border bg-background text-muted-foreground transition-colors hover:border-border/60 hover:bg-accent hover:text-foreground",
        className,
      )}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

export function ThemeSegments({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const options: { value: Theme; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
    { value: "light", label: "Claro", Icon: Sun },
    { value: "system", label: "Auto", Icon: Monitor },
    { value: "dark", label: "Oscuro", Icon: Moon },
  ];
  return (
    <div
      role="radiogroup"
      aria-label="Tema"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-sm border border-border bg-background p-0.5",
        className,
      )}
    >
      {options.map(({ value, label, Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            role="radio"
            aria-checked={active}
            type="button"
            onClick={() => setTheme(value)}
            title={label}
            className={cn(
              "inline-flex h-7 items-center gap-1.5 rounded-sm px-2 text-[11px] font-medium uppercase tracking-[0.12em] transition-colors",
              active
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
