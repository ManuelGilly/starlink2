import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ⚠️ ENDPOINT TEMPORAL — siembra/limpia una suscripción de prueba para demostrar
// el aviso de "suscripciones por vencer". Eliminar tras la demo.
// Protegido por CRON_SECRET. Marcadores fijos para poder limpiar después.
const TEST_PLAN_CODE = "TEST-DEMO";
const TEST_CLIENT_EMAIL = "demo-prueba@starlink.ve";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");
  const auth = req.headers.get("authorization");
  const ok = auth === `Bearer ${process.env.CRON_SECRET}` || secret === process.env.CRON_SECRET;
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cleanup = url.searchParams.get("cleanup") === "1";

  // --- Limpieza ---
  if (cleanup) {
    const client = await prisma.client.findFirst({ where: { email: TEST_CLIENT_EMAIL } });
    if (client) await prisma.client.delete({ where: { id: client.id } }); // cascada borra suscripciones
    const plan = await prisma.plan.findUnique({ where: { code: TEST_PLAN_CODE } });
    if (plan) {
      try {
        await prisma.plan.delete({ where: { id: plan.id } });
      } catch {
        /* si quedó alguna referencia, se ignora */
      }
    }
    return NextResponse.json({ ok: true, cleaned: true });
  }

  // --- Siembra ---
  // Plan de prueba (upsert por code único)
  const plan = await prisma.plan.upsert({
    where: { code: TEST_PLAN_CODE },
    update: { active: true },
    create: { code: TEST_PLAN_CODE, name: "Plan de Prueba (DEMO)", price: 50, billingCycle: "MONTHLY", active: true },
  });

  // Cliente de prueba (email no es único → findFirst + create)
  let client = await prisma.client.findFirst({ where: { email: TEST_CLIENT_EMAIL } });
  if (!client) {
    client = await prisma.client.create({
      data: { firstName: "Cliente", lastName: "de Prueba", email: TEST_CLIENT_EMAIL, phone: "04140000000" },
    });
  }

  // Día de cobro = hoy (cae dentro de la ventana de 5 días), tope 28.
  const billingDay = Math.min(new Date().getDate(), 28);

  // Suscripción ACTIVA (reutiliza si ya existe una de prueba)
  let sub = await prisma.subscription.findFirst({
    where: { clientId: client.id, planId: plan.id, status: "ACTIVA" },
  });
  if (sub) {
    sub = await prisma.subscription.update({ where: { id: sub.id }, data: { billingDay, priceLocked: 50 } });
  } else {
    sub = await prisma.subscription.create({
      data: { clientId: client.id, planId: plan.id, status: "ACTIVA", billingDay, priceLocked: 50 },
    });
  }

  return NextResponse.json({
    ok: true,
    seeded: { clientId: client.id, planId: plan.id, subscriptionId: sub.id, billingDay },
  });
}
