import { prisma } from "@/lib/db";

export type ChargeMode = "FIXED" | "PERCENT";

export interface LotChargeInput {
  applies: boolean;
  mode?: ChargeMode | null;
  value?: number | null; // USD si FIXED, % si PERCENT
}

export interface LotCostInput {
  quantity: number;
  baseUnitCost: number;
  freight: LotChargeInput;
  tax: LotChargeInput;
}

export interface LotCostResult {
  baseTotal: number;
  freightTotalUSD: number;
  taxTotalUSD: number;
  landedTotal: number;
  landedUnitCost: number;
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * Resuelve el costo "landed" (real) de un lote de compra.
 * Flete e impuesto pueden ser monto fijo (USD) o porcentaje.
 * El porcentaje se calcula SOBRE EL COSTO BASE solamente (el flete no entra
 * en la base del impuesto), según lo definido con el negocio.
 */
export function resolveLotCosts(input: LotCostInput): LotCostResult {
  const baseTotal = round2(input.baseUnitCost * input.quantity);

  const chargeUSD = (c: LotChargeInput): number => {
    if (!c.applies || c.value == null) return 0;
    if (c.mode === "PERCENT") return round2((baseTotal * c.value) / 100);
    return round2(c.value); // FIXED
  };

  const freightTotalUSD = chargeUSD(input.freight);
  const taxTotalUSD = chargeUSD(input.tax);
  const landedTotal = round2(baseTotal + freightTotalUSD + taxTotalUSD);
  const landedUnitCost = input.quantity > 0 ? round2(landedTotal / input.quantity) : 0;

  return { baseTotal, freightTotalUSD, taxTotalUSD, landedTotal, landedUnitCost };
}

/**
 * Costo landed unitario del lote más reciente de un producto, o null si no hay lotes.
 * Base de costo para productos NO serializados al vender.
 */
export async function lastLotLandedCost(productId: string): Promise<number | null> {
  const lot = await prisma.purchaseLot.findFirst({
    where: { productId },
    orderBy: { purchasedAt: "desc" },
    select: { landedUnitCost: true },
  });
  return lot ? Number(lot.landedUnitCost) : null;
}
