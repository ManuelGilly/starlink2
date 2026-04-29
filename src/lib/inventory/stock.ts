import { prisma } from "@/lib/db";

/**
 * Calcula el stock actual sumando movimientos según signo por tipo.
 * ENTRADA, DEVOLUCION  => suma
 * SALIDA, MERMA        => resta
 * AJUSTE               => usa el signo de quantity tal cual
 */
export async function stockForProduct(productId: string): Promise<number> {
  const movs = await prisma.inventoryMovement.findMany({
    where: { productId },
    select: { type: true, quantity: true },
  });
  let stock = 0;
  for (const m of movs) {
    switch (m.type) {
      case "ENTRADA":
      case "DEVOLUCION":
        stock += m.quantity;
        break;
      case "SALIDA":
      case "MERMA":
        stock -= m.quantity;
        break;
      case "AJUSTE":
        stock += m.quantity; // firmado
        break;
    }
  }
  return stock;
}

export async function stockForAllProducts(): Promise<Record<string, number>> {
  const movs = await prisma.inventoryMovement.findMany({
    select: { productId: true, type: true, quantity: true },
  });
  const acc: Record<string, number> = {};
  for (const m of movs) {
    const s = acc[m.productId] ?? 0;
    if (m.type === "ENTRADA" || m.type === "DEVOLUCION") acc[m.productId] = s + m.quantity;
    else if (m.type === "SALIDA" || m.type === "MERMA") acc[m.productId] = s - m.quantity;
    else acc[m.productId] = s + m.quantity;
  }
  return acc;
}
