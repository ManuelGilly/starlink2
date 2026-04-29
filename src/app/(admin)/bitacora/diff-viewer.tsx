"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

function fmt(v: any): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

export function DiffViewer({ diff }: { diff: any }) {
  const [open, setOpen] = useState(false);

  if (!diff) return <span className="text-[11px] text-muted-foreground">sin cambios</span>;

  // Detectar si es CREATE (tiene __created), DELETE (__deleted) o UPDATE (pares from/to)
  if (diff.__created) {
    const keys = Object.keys(diff.__created);
    return (
      <div className="text-[11px]">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300"
        >
          {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          {keys.length} campos creados
        </button>
        {open && (
          <div className="mt-1 rounded-sm border border-border bg-muted p-2">
            {keys.map((k) => (
              <div key={k} className="flex gap-2">
                <span className="text-muted-foreground">{k}:</span>
                <span className="truncate">{fmt(diff.__created[k])}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (diff.__deleted) {
    const keys = Object.keys(diff.__deleted);
    return (
      <div className="text-[11px]">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-1 text-destructive hover:text-destructive/80"
        >
          {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          estado borrado ({keys.length} campos)
        </button>
        {open && (
          <div className="mt-1 max-h-64 overflow-auto rounded-sm border border-border bg-muted p-2">
            {keys.map((k) => (
              <div key={k} className="flex gap-2">
                <span className="text-muted-foreground">{k}:</span>
                <span className="truncate">{fmt(diff.__deleted[k])}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // UPDATE — mapa de { field: { from, to } }
  const keys = Object.keys(diff);
  if (keys.length === 0) return <span className="text-[11px] text-muted-foreground">sin cambios</span>;

  return (
    <div className="space-y-0.5 text-[11px]">
      {keys.map((k) => {
        const change = diff[k];
        return (
          <div key={k} className="flex flex-wrap items-baseline gap-1.5">
            <span className="text-muted-foreground">{k}:</span>
            <span className="text-destructive line-through decoration-destructive/50 truncate max-w-[140px]">{fmt(change.from)}</span>
            <span className="text-muted-foreground">→</span>
            <span className="text-emerald-400 truncate max-w-[140px]">{fmt(change.to)}</span>
          </div>
        );
      })}
    </div>
  );
}
