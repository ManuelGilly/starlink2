import { prisma } from "@/lib/db";
import { stockForAllProducts } from "./stock";

export interface ProjectionItem {
  productId: string;
  sku: string;
  name: string;
  currentStock: number;
  minStock: number;
  // Ventas/salidas en el período de análisis
  outflowInWindow: number;
  // Días del período analizado
  windowDays: number;
  // Proyección para N días futuros
  projectionDays: number;
  avgDailyOutflow: number;
  projectedStock: number;
  projectedDeficit: number; // positivo si se espera déficit por debajo del mínimo
}

/**
 * Rotación y proyección: calcula salidas promedio/día en windowDays y proyecta el stock en projectionDays.
 */
export async function projectInventory(params: {
  windowDays?: number;     // ventana histórica para promediar (default 30)
  projectionDays?: number; // horizonte futuro (default 30)
}): Promise<ProjectionItem[]> {
  const windowDays = params.windowDays ?? 30;
  const projectionDays = params.projectionDays ?? 30;

  const since = new Date();
  since.setDate(since.getDate() - windowDays);

  const [products, stocks, outflows] = await Promise.all([
    prisma.product.findMany({ where: { active: true } }),
    stockForAllProducts(),
    prisma.inventoryMovement.groupBy({
      by: ["productId"],
      where: { type: { in: ["SALIDA", "MERMA"] }, occurredAt: { gte: since } },
      _sum: { quantity: true },
    }),
  ]);

  const outflowMap: Record<string, number> = {};
  for (const o of outflows) outflowMap[o.productId] = o._sum.quantity ?? 0;

  return products.map((p) => {
    const currentStock = stocks[p.id] ?? 0;
    const outflowInWindow = outflowMap[p.id] ?? 0;
    const avgDailyOutflow = windowDays > 0 ? outflowInWindow / windowDays : 0;
    const projectedStock = Math.max(0, Math.round(currentStock - avgDailyOutflow * projectionDays));
    const projectedDeficit = Math.max(0, p.minStock - projectedStock);
    return {
      productId: p.id,
      sku: p.sku,
      name: p.name,
      currentStock,
      minStock: p.minStock,
      outflowInWindow,
      windowDays,
      projectionDays,
      avgDailyOutflow,
      projectedStock,
      projectedDeficit,
    };
  });
}
