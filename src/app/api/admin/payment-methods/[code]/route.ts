import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";

export const runtime = "nodejs";

const PAYMENT_METHODS = [
  "ZELLE",
  "PAYPAL",
  "BINANCE",
  "EFECTIVO_USD",
  "TRANSFERENCIA_USD",
  "PAGO_MOVIL",
  "OTRO",
] as const;

const patchSchema = z.object({
  label: z.string().min(1).max(80).optional(),
  accountEmail: z.string().max(160).nullable().optional(),
  accountInfo: z.string().max(2000).nullable().optional(),
  commissionPct: z
    .union([z.number().min(0).max(100), z.string().regex(/^\d+(\.\d+)?$/)])
    .nullable()
    .optional(),
  requiresReceipt: z.boolean().optional(),
  showVesAmount: z.boolean().optional(),
  instructions: z.string().max(2000).nullable().optional(),
  active: z.boolean().optional(),
  order: z.number().int().min(0).max(999).optional(),
});

export async function PATCH(req: Request, { params }: { params: { code: string } }) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const code = params.code.toUpperCase();
  if (!PAYMENT_METHODS.includes(code as any)) {
    return NextResponse.json({ error: "Método inválido" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const updated = await prisma.paymentMethodConfig.update({
    where: { code: code as any },
    data: {
      ...(data.label !== undefined && { label: data.label }),
      ...(data.accountEmail !== undefined && { accountEmail: data.accountEmail || null }),
      ...(data.accountInfo !== undefined && { accountInfo: data.accountInfo || null }),
      ...(data.commissionPct !== undefined && {
        commissionPct: data.commissionPct === null ? null : String(data.commissionPct),
      }),
      ...(data.requiresReceipt !== undefined && { requiresReceipt: data.requiresReceipt }),
      ...(data.showVesAmount !== undefined && { showVesAmount: data.showVesAmount }),
      ...(data.instructions !== undefined && { instructions: data.instructions || null }),
      ...(data.active !== undefined && { active: data.active }),
      ...(data.order !== undefined && { order: data.order }),
    },
  });

  return NextResponse.json({ ok: true, code: updated.code });
}
