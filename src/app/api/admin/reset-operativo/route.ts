import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const SECRET = "2e104eb43ff37bc68b4ac7949346fbc8a7f1b936";

export async function POST(req: Request) {
  if (req.headers.get("x-reset-secret") !== SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const [reports, payments, subscriptions] = await prisma.$transaction([
    prisma.paymentReport.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.subscription.deleteMany(),
  ]);

  return NextResponse.json({
    ok: true,
    deleted: {
      paymentReports: reports.count,
      payments: payments.count,
      subscriptions: subscriptions.count,
    },
  });
}
