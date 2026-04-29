import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { saveReceiptFile } from "@/lib/uploads";
import { sendNotification } from "@/lib/notifications";
import { formatUSD } from "@/lib/utils";

export const runtime = "nodejs";

const schema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  email: z.string().email().max(160),
  phone: z.string().min(6).max(40),
  antennaId: z.string().min(3).max(80),
  planId: z.string().min(1),
  paymentMethod: z.enum(["ZELLE", "PAYPAL", "BINANCE", "EFECTIVO_USD", "TRANSFERENCIA_USD", "OTRO"]),
  paymentReference: z.string().max(120).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export async function GET() {
  const plans = await prisma.plan.findMany({
    where: { active: true },
    orderBy: { price: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
      price: true,
      billingCycle: true,
    },
  });
  return NextResponse.json(plans);
}

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Se esperaba multipart/form-data" }, { status: 400 });
  }

  const raw = {
    firstName: String(form.get("firstName") ?? "").trim(),
    lastName: String(form.get("lastName") ?? "").trim(),
    email: String(form.get("email") ?? "").trim().toLowerCase(),
    phone: String(form.get("phone") ?? "").trim(),
    antennaId: String(form.get("antennaId") ?? "").trim(),
    planId: String(form.get("planId") ?? "").trim(),
    paymentMethod: String(form.get("paymentMethod") ?? "").trim(),
    paymentReference: (form.get("paymentReference") as string | null) || null,
    notes: (form.get("notes") as string | null) || null,
  };

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const receipt = form.get("receipt");
  if (!(receipt instanceof File)) {
    return NextResponse.json({ error: "Debes adjuntar el comprobante de pago" }, { status: 400 });
  }

  const plan = await prisma.plan.findUnique({ where: { id: parsed.data.planId } });
  if (!plan || !plan.active) {
    return NextResponse.json({ error: "Plan no disponible" }, { status: 400 });
  }

  let upload;
  try {
    upload = await saveReceiptFile(receipt, "receipts");
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Error al subir comprobante" }, { status: 400 });
  }

  const request = await prisma.planRequest.create({
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email: parsed.data.email,
      phone: parsed.data.phone,
      antennaId: parsed.data.antennaId,
      planId: plan.id,
      amount: plan.price,
      paymentMethod: parsed.data.paymentMethod,
      paymentReference: parsed.data.paymentReference ?? undefined,
      receiptUrl: upload.url,
      notes: parsed.data.notes ?? undefined,
    },
  });

  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL || process.env.CONTACT_EMAIL || process.env.SEED_ADMIN_EMAIL;
  if (adminEmail) {
    const appUrl = process.env.NEXTAUTH_URL ?? "";
    const receiptFullUrl = appUrl ? `${appUrl}${upload.url}` : upload.url;
    const adminDetailUrl = appUrl ? `${appUrl}/solicitudes-activacion` : "/solicitudes-activacion";

    const subject = `Nueva solicitud de activación de plan — ${parsed.data.firstName} ${parsed.data.lastName}`;
    const body = [
      "Se recibió una nueva solicitud de activación de plan.",
      "",
      `Cliente: ${parsed.data.firstName} ${parsed.data.lastName}`,
      `Email: ${parsed.data.email}`,
      `Teléfono: ${parsed.data.phone}`,
      `ID de antena: ${parsed.data.antennaId}`,
      "",
      `Plan: ${plan.name} (${plan.code})`,
      `Monto: ${formatUSD(Number(plan.price))}`,
      `Método de pago: ${parsed.data.paymentMethod}`,
      parsed.data.paymentReference ? `Referencia: ${parsed.data.paymentReference}` : null,
      "",
      `Comprobante: ${receiptFullUrl}`,
      parsed.data.notes ? `Notas del cliente: ${parsed.data.notes}` : null,
      "",
      `Revisar en el panel: ${adminDetailUrl}`,
    ]
      .filter(Boolean)
      .join("\n");

    // No await bloqueante: si falla el email, la solicitud ya quedó registrada.
    sendNotification({
      channel: "EMAIL",
      recipient: adminEmail,
      subject,
      body,
      relatedType: "PlanRequest",
      relatedId: request.id,
    }).catch((e) => console.error("[solicitud-activacion] error notificando admin:", e));
  } else {
    console.warn("[solicitud-activacion] No hay ADMIN_NOTIFY_EMAIL/CONTACT_EMAIL configurado; no se envió email al admin.");
  }

  return NextResponse.json({ id: request.id, ok: true }, { status: 201 });
}
