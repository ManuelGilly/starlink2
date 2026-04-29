"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatUSD } from "@/lib/utils";

const COLOR_PRIMARY = "#0080ff";
const COLOR_SECONDARY = "#6366f1";
const COLOR_MUTED = "#2a2a2a";
const COLOR_ACCENTS = ["#0080ff", "#22d3ee", "#a78bfa", "#f59e0b", "#10b981", "#ef4444", "#f472b6"];

const tooltipStyle = {
  background: "#0a0a0a",
  border: "1px solid #242424",
  borderRadius: 4,
  fontSize: 12,
  color: "#fafafa",
};
const labelStyle = { color: "#999", fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.1em" };

// ==================== Facturación mensual — Area ====================
export function MonthlyBillingChart({
  data,
}: {
  data: Array<{ monthLabel: string; billing: number; purchases: number; profit: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="billingGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLOR_PRIMARY} stopOpacity={0.5} />
            <stop offset="100%" stopColor={COLOR_PRIMARY} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={COLOR_MUTED} vertical={false} />
        <XAxis dataKey="monthLabel" stroke="#666" tick={{ fill: "#999", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis
          stroke="#666"
          tick={{ fill: "#999", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => (v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`)}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          labelStyle={labelStyle}
          formatter={(v: number, name: string) => [formatUSD(v), name === "billing" ? "Facturación" : name === "profit" ? "Ganancia" : "Compras"]}
        />
        <Area type="monotone" dataKey="billing" stroke={COLOR_PRIMARY} strokeWidth={2} fill="url(#billingGrad)" />
        <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} fill="url(#profitGrad)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ==================== Compras vs Ingresos — Bars ====================
export function CashflowChart({
  data,
}: {
  data: Array<{ monthLabel: string; billing: number; purchases: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={COLOR_MUTED} vertical={false} />
        <XAxis dataKey="monthLabel" stroke="#666" tick={{ fill: "#999", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis
          stroke="#666"
          tick={{ fill: "#999", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => (v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`)}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          labelStyle={labelStyle}
          formatter={(v: number, name: string) => [formatUSD(v), name === "billing" ? "Ingresos" : "Compras"]}
        />
        <Legend wrapperStyle={{ fontSize: 11, color: "#999", textTransform: "uppercase", letterSpacing: "0.1em" }} formatter={(v) => (v === "billing" ? "Ingresos" : "Compras")} />
        <Bar dataKey="billing" fill={COLOR_PRIMARY} radius={[2, 2, 0, 0]} />
        <Bar dataKey="purchases" fill="#dc2626" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ==================== Métodos de pago — Donut ====================
export function MethodsDonutChart({ data }: { data: Array<{ key: string; amount: number }> }) {
  const total = data.reduce((acc, d) => acc + d.amount, 0);
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="key"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            stroke="none"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLOR_ACCENTS[i % COLOR_ACCENTS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(v: number, name: string) => [formatUSD(v), name]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Total</div>
        <div className="font-display text-xl font-semibold">{formatUSD(total)}</div>
      </div>
      <div className="mt-3 space-y-1">
        {data.map((d, i) => (
          <div key={d.key} className="flex items-center justify-between text-[12px]">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-sm" style={{ background: COLOR_ACCENTS[i % COLOR_ACCENTS.length] }} />
              <span className="text-muted-foreground">{d.key}</span>
            </div>
            <span className="font-mono">{formatUSD(d.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== Suscripciones por plan ====================
export function PlansBreakdownChart({ data }: { data: Array<{ key: string; count: number; amount: number }> }) {
  const total = data.reduce((a, d) => a + d.count, 0);
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="key"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            stroke="none"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLOR_ACCENTS[i % COLOR_ACCENTS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(v: number, name: string) => [`${v} suscripciones`, name]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Activas</div>
        <div className="font-display text-xl font-semibold">{total}</div>
      </div>
      <div className="mt-3 space-y-1">
        {data.map((d, i) => (
          <div key={d.key} className="flex items-center justify-between text-[12px]">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-sm" style={{ background: COLOR_ACCENTS[i % COLOR_ACCENTS.length] }} />
              <span className="text-muted-foreground">{d.key}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground">{d.count}</span>
              <span className="font-mono">{formatUSD(d.amount)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== Stock vs mínimo — Bars horizontales ====================
export function InventoryHealthChart({
  data,
}: {
  data: Array<{ name: string; stock: number; minStock: number }>;
}) {
  const height = Math.max(180, data.length * 32);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={COLOR_MUTED} horizontal={false} />
        <XAxis type="number" stroke="#666" tick={{ fill: "#999", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="name"
          stroke="#666"
          tick={{ fill: "#ccc", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={140}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(v: number, name: string) => [v, name === "stock" ? "Stock actual" : "Mínimo"]}
        />
        <Legend wrapperStyle={{ fontSize: 11, color: "#999", textTransform: "uppercase", letterSpacing: "0.1em" }} formatter={(v) => (v === "stock" ? "Stock actual" : "Mínimo")} />
        <Bar dataKey="minStock" fill="#2a2a2a" radius={[0, 2, 2, 0]} />
        <Bar dataKey="stock" fill={COLOR_PRIMARY} radius={[0, 2, 2, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ==================== Estados de pago — Barra horizontal ====================
export function PaymentStatusChart({ data }: { data: Array<{ key: string; count: number; amount: number }> }) {
  const COLORS: Record<string, string> = {
    CONFIRMADO: "#10b981",
    REPORTADO: "#f59e0b",
    PENDIENTE: "#6b7280",
    RECHAZADO: "#dc2626",
  };
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={COLOR_MUTED} vertical={false} />
        <XAxis dataKey="key" stroke="#666" tick={{ fill: "#999", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis
          stroke="#666"
          tick={{ fill: "#999", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => (v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`)}
        />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string, p: any) => [formatUSD(v) + ` (${p.payload.count} reg.)`, "Monto"]} />
        <Bar dataKey="amount" radius={[2, 2, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={COLORS[d.key] ?? COLOR_PRIMARY} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
