import { prisma } from "@/lib/db";
import { sendNotification } from "@/lib/notifications";
import { formatUSD } from "@/lib/utils";

/**
 * Arma y envía al Telegram del admin un resumen de las suscripciones activas
 * cuyo día de cobro (billingDay) cae dentro de los próximos N días.
 *
 * Requiere en producción:
 *  - TELEGRAM_BOT_TOKEN (env)
 *  - TELEGRAM_ADMIN_CHAT_ID (env) — el chat del admin que recibe el aviso
 *  - Canal TELEGRAM habilitado (NotificationChannel.enabled = true)
 */
export async function runExpiringSubscriptionsDigest(days = 5) {
  const today = new Date();

  // Días del mes que caen dentro de la ventana [hoy, hoy+days].
  const dueDateByDay = new Map<number, Date>();
  for (let i = 0; i <= days; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    if (!dueDateByDay.has(d.getDate())) dueDateByDay.set(d.getDate(), d);
  }
  const dayNumbers = Array.from(dueDateByDay.keys());

  const subs = await prisma.subscription.findMany({
    where: { status: "ACTIVA", billingDay: { in: dayNumbers } },
    include: { client: true, plan: true },
  });

  // Ordenar por fecha de vencimiento más próxima.
  const rows = subs
    .map((s) => ({
      sub: s,
      dueDate: dueDateByDay.get(s.billingDay) ?? today,
      amount: Number(s.priceLocked),
    }))
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  const total = rows.reduce((acc, r) => acc + r.amount, 0);

  // Mensaje en HTML (Telegram parse_mode=HTML).
  const fmtDay = (d: Date) => d.toLocaleDateString("es-VE", { day: "2-digit", month: "2-digit" });
  let body: string;
  if (rows.length === 0) {
    body = `🔔 <b>Suscripciones por vencer (próximos ${days} días)</b>\n\nNo hay suscripciones que venzan en este período. ✅`;
  } else {
    const lines = rows
      .map(
        (r) =>
          `• <b>${r.sub.client.firstName} ${r.sub.client.lastName}</b> — ${r.sub.plan.name}\n` +
          `   Vence: ${fmtDay(r.dueDate)} · ${formatUSD(r.amount)}`,
      )
      .join("\n");
    body =
      `🔔 <b>Suscripciones por vencer (próximos ${days} días)</b>\n\n` +
      `${lines}\n\n` +
      `Total: ${rows.length} suscripción(es) · ${formatUSD(total)}`;
  }

  // Estado de configuración (para diagnóstico).
  const adminChat = process.env.TELEGRAM_ADMIN_CHAT_ID ?? null;
  const tokenConfigured = Boolean(process.env.TELEGRAM_BOT_TOKEN);
  const channel = await prisma.notificationChannel.findUnique({ where: { type: "TELEGRAM" } });
  const channelEnabled = channel?.enabled ?? false;

  let sendResult: { success: boolean; error?: string; logId?: string } | null = null;
  if (adminChat) {
    const r = await sendNotification({
      channel: "TELEGRAM",
      recipient: adminChat,
      body,
      relatedType: "Subscription",
    });
    sendResult = { success: r.success, error: r.error, logId: r.logId };
  }

  return {
    windowDays: days,
    count: rows.length,
    total,
    items: rows.map((r) => ({
      client: `${r.sub.client.firstName} ${r.sub.client.lastName}`,
      plan: r.sub.plan.name,
      dueDate: fmtDay(r.dueDate),
      amount: r.amount,
      billingDay: r.sub.billingDay,
    })),
    message: body,
    config: { adminChatConfigured: Boolean(adminChat), tokenConfigured, channelEnabled },
    sendResult,
  };
}
