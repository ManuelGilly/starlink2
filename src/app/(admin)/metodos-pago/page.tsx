import { prisma } from "@/lib/db";
import { Topbar } from "@/components/layout/topbar";
import { PaymentMethodsAdmin } from "./client";

export const dynamic = "force-dynamic";

export default async function MetodosPagoPage() {
  const [methods, rateSetting] = await Promise.all([
    prisma.paymentMethodConfig.findMany({ orderBy: { order: "asc" } }),
    prisma.appSetting.findUnique({ where: { key: "BINANCE_PARALELO_VES_USD" } }),
  ]);

  const methodData = methods.map((m) => ({
    code: m.code,
    label: m.label,
    accountEmail: m.accountEmail,
    accountInfo: m.accountInfo,
    commissionPct: m.commissionPct ? Number(m.commissionPct) : null,
    requiresReceipt: m.requiresReceipt,
    showVesAmount: m.showVesAmount,
    instructions: m.instructions,
    active: m.active,
    order: m.order,
  }));

  return (
    <>
      <Topbar title="Métodos de pago" />
      <div className="p-6">
        <PaymentMethodsAdmin
          methods={methodData}
          paraleloRate={rateSetting?.value ?? "0"}
        />
      </div>
    </>
  );
}
