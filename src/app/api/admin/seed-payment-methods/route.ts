import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULTS = [
  {
    code: "ZELLE" as const,
    label: "Zelle",
    accountEmail: "",
    accountInfo: "Envía el monto exacto en USD al email indicado.",
    requiresReceipt: true,
    showVesAmount: false,
    order: 1,
  },
  {
    code: "PAYPAL" as const,
    label: "PayPal",
    accountEmail: "",
    accountInfo: "Suma la comisión al monto antes de enviar.",
    commissionPct: "5.40",
    requiresReceipt: true,
    showVesAmount: false,
    order: 2,
  },
  {
    code: "BINANCE" as const,
    label: "Binance Pay",
    accountEmail: "",
    accountInfo: "Envía USDT al email/usuario indicado.",
    requiresReceipt: true,
    showVesAmount: false,
    order: 3,
  },
  {
    code: "EFECTIVO_USD" as const,
    label: "Efectivo (USD)",
    accountInfo: "Pago en persona en la dirección de la empresa.",
    requiresReceipt: false,
    showVesAmount: false,
    order: 4,
  },
  {
    code: "PAGO_MOVIL" as const,
    label: "Pago móvil (Bs)",
    accountInfo: "Banco / Cédula / Teléfono — completar en admin.",
    requiresReceipt: true,
    showVesAmount: true,
    order: 5,
  },
];

export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  if (!process.env.ADMIN_SEED_SECRET || auth !== `Bearer ${process.env.ADMIN_SEED_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const upserted: string[] = [];
    for (const m of DEFAULTS) {
      const r = await prisma.paymentMethodConfig.upsert({
        where: { code: m.code },
        update: {},
        create: {
          code: m.code,
          label: m.label,
          accountEmail: m.accountEmail ?? null,
          accountInfo: m.accountInfo ?? null,
          commissionPct: m.commissionPct ?? null,
          requiresReceipt: m.requiresReceipt,
          showVesAmount: m.showVesAmount,
          order: m.order,
          active: true,
        },
      });
      upserted.push(r.code);
    }

    await prisma.appSetting.upsert({
      where: { key: "BINANCE_PARALELO_VES_USD" },
      update: {},
      create: { key: "BINANCE_PARALELO_VES_USD", value: "0" },
    });

    return NextResponse.json({ ok: true, methods: upserted });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "error" }, { status: 500 });
  }
}
