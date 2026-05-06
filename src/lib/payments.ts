import type { Client, Payment } from "@prisma/client";
import { sendFromTemplate } from "@/lib/notifications";
import { formatUSD } from "@/lib/utils";

export async function notifyPaymentConfirmed(payment: Payment, client: Pick<Client, "phone" | "firstName">) {
  try {
    await sendFromTemplate({
      templateCode: "PAYMENT_CONFIRMED",
      recipient: client.phone,
      vars: { clientName: client.firstName, amount: formatUSD(Number(payment.amount)) },
      channelOverride: "WHATSAPP",
      relatedType: "Payment",
      relatedId: payment.id,
    });
  } catch (e) {
    console.error("Fallo notificación pago confirmado:", e);
  }
}
