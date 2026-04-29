import { prisma } from "@/lib/db";
import { projectInventory } from "@/lib/inventory/projection";
import { sendFromTemplate } from "@/lib/notifications";

/**
 * Revisa proyección de inventario y alerta a los admins si hay déficit proyectado.
 */
export async function runDeficitProjection(params?: { windowDays?: number; projectionDays?: number }) {
  const items = await projectInventory({
    windowDays: params?.windowDays ?? 30,
    projectionDays: params?.projectionDays ?? 30,
  });
  const critical = items.filter((i) => i.projectedDeficit > 0);
  if (critical.length === 0) {
    console.log(`[deficit] OK — sin déficit proyectado`);
    return { alerts: 0 };
  }

  // Destinatarios: todos los admins activos
  const admins = await prisma.user.findMany({
    where: { active: true, roles: { some: { role: { name: "ADMIN" } } } },
  });

  let sent = 0;
  for (const item of critical) {
    for (const admin of admins) {
      try {
        await sendFromTemplate({
          templateCode: "STOCK_DEFICIT",
          recipient: admin.email,
          channelOverride: "EMAIL",
          vars: {
            productName: item.name,
            sku: item.sku,
            currentStock: item.currentStock,
            days: item.projectionDays,
            projectedStock: item.projectedStock,
            minStock: item.minStock,
          },
          relatedType: "Inventory",
          relatedId: item.productId,
        });
        sent++;
      } catch (e) {
        console.error("[deficit] fallo notificación:", e);
      }
    }
  }
  console.log(`[deficit] ${critical.length} productos críticos, ${sent} notificaciones enviadas`);
  return { alerts: critical.length, sent };
}
