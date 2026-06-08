import { prisma } from "@/lib/db";
import { VES_RATE_KEY } from "@/lib/payments/methods";

/** Lee la tasa Bs/USD vigente (AppSetting). 0 si no está configurada. */
export async function getVesRate(): Promise<number> {
  const s = await prisma.appSetting.findUnique({ where: { key: VES_RATE_KEY } });
  const n = s ? Number(s.value) : 0;
  return Number.isFinite(n) ? n : 0;
}
