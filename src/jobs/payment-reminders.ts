import { prisma } from "@/lib/db";
import { sendFromTemplate } from "@/lib/notifications";
import { formatUSD } from "@/lib/utils";

/**
 * Envía recordatorios de cobro por WhatsApp a clientes con suscripción activa cuyo día de corte
 * coincide con hoy o está a 3 días de distancia.
 */
export async function runPaymentReminders() {
  const today = new Date();
  const day = today.getDate();
  const in3 = new Date(today); in3.setDate(day + 3);
  const dayIn3 = in3.getDate();

  const subs = await prisma.subscription.findMany({
    where: {
      status: "ACTIVA",
      billingDay: { in: [day, dayIn3] },
    },
    include: { client: true, plan: true },
  });

  let sent = 0;
  for (const sub of subs) {
    const isDueToday = sub.billingDay === day;
    const dueDate = new Date(today.getFullYear(), today.getMonth(), sub.billingDay);
    const portalUrl = process.env.NEXTAUTH_URL ? `${process.env.NEXTAUTH_URL}/mi-cuenta` : "";
    try {
      await sendFromTemplate({
        templateCode: "PAYMENT_REMINDER",
        recipient: sub.client.phone,
        channelOverride: "WHATSAPP",
        vars: {
          clientName: sub.client.firstName,
          planName: sub.plan.name,
          amount: formatUSD(Number(sub.priceLocked)),
          dueDate: dueDate.toLocaleDateString("es-VE"),
          portalUrl,
        },
        relatedType: "Subscription",
        relatedId: sub.id,
      });
      sent++;
    } catch (e) {
      console.error("[reminders] fallo:", e);
    }
  }
  console.log(`[reminders] ${sent}/${subs.length} enviados (hoy=${day}, en3d=${dayIn3})`);
  return { evaluated: subs.length, sent };
}
