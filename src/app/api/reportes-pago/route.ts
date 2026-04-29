import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/rbac";

const schema = z.object({
  subscriptionId: z.string().optional().nullable(),
  amount: z.coerce.number().positive(),
  method: z.enum(["ZELLE", "PAYPAL", "BINANCE", "EFECTIVO_USD", "TRANSFERENCIA_USD", "OTRO"]),
  reference: z.string().optional().nullable(),
  receiptUrl: z.string().url().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const client = await prisma.client.findFirst({ where: { userId: user.id } });
  if (!client) return NextResponse.json({ error: "Cliente no vinculado al usuario" }, { status: 400 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const report = await prisma.paymentReport.create({
    data: {
      clientId: client.id,
      subscriptionId: parsed.data.subscriptionId ?? undefined,
      amount: parsed.data.amount,
      method: parsed.data.method,
      reference: parsed.data.reference ?? undefined,
      receiptUrl: parsed.data.receiptUrl ?? undefined,
      notes: parsed.data.notes ?? undefined,
    },
  });

  // Crear Payment en estado REPORTADO pendiente de confirmación
  const payment = await prisma.payment.create({
    data: {
      clientId: client.id,
      subscriptionId: parsed.data.subscriptionId ?? undefined,
      amount: parsed.data.amount,
      method: parsed.data.method,
      reference: parsed.data.reference ?? undefined,
      status: "REPORTADO",
      notes: parsed.data.notes ?? undefined,
    },
  });

  await prisma.paymentReport.update({
    where: { id: report.id },
    data: { paymentId: payment.id },
  });

  return NextResponse.json({ report, payment }, { status: 201 });
}
