import { isBolivarMethod } from "@/lib/payments/methods";
import type { PaymentMethod } from "@prisma/client";

export interface SplitInput {
  method: PaymentMethod;
  amountUSD?: number | null;
  amountVes?: number | null;
  vesRate?: number | null;
  reference?: string | null;
}

export interface NormalizedSplit {
  method: PaymentMethod;
  amountUSD: number;
  amountVes: number | null;
  vesRate: number | null;
  reference: string | null;
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * Normaliza los splits de un pago:
 * - Para métodos en Bs con monto Bs + tasa: deriva amountUSD = amountVes / vesRate.
 * - Para el resto: usa amountUSD directo.
 * Devuelve los splits normalizados y el total en USD (canónico del pago).
 * Lanza Error con mensaje legible si algún split es inválido.
 */
export function normalizeSplits(splits: SplitInput[]): { splits: NormalizedSplit[]; totalUSD: number } {
  if (!splits || splits.length === 0) {
    throw new Error("Indica al menos un método de pago");
  }

  const out: NormalizedSplit[] = splits.map((s) => {
    let amountUSD: number;
    let amountVes: number | null = null;
    let vesRate: number | null = null;

    if (isBolivarMethod(s.method) && s.amountVes != null && s.vesRate != null) {
      amountVes = round2(Number(s.amountVes));
      vesRate = Number(s.vesRate);
      if (!(vesRate > 0)) throw new Error("La tasa Bs/USD debe ser mayor a 0");
      amountUSD = round2(amountVes / vesRate);
    } else {
      amountUSD = round2(Number(s.amountUSD ?? 0));
    }

    if (!(amountUSD > 0)) throw new Error("Cada método debe tener un monto mayor a 0");

    return {
      method: s.method,
      amountUSD,
      amountVes,
      vesRate,
      reference: s.reference?.toString().trim() || null,
    };
  });

  const totalUSD = round2(out.reduce((acc, s) => acc + s.amountUSD, 0));
  return { splits: out, totalUSD };
}
