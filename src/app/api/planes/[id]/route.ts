import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ADMIN_OR_INV, requireRole } from "@/lib/rbac";
import { audit, getRequestInfo } from "@/lib/audit";

const schema = z.object({
  code: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  details: z.string().nullable().optional(),
  price: z.coerce.number().nonnegative().optional(),
  cost: z.coerce.number().nonnegative().nullable().optional(),
  billingCycle: z.enum(["MONTHLY", "YEARLY", "ONE_TIME"]).optional(),
  active: z.boolean().optional(),
});

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireRole(ADMIN_OR_INV);
  if (error) return error;
  const plan = await prisma.plan.findUnique({ where: { id: params.id } });
  if (!plan) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(plan);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { error, user } = await requireRole(ADMIN_OR_INV);
  if (error) return error;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const before = await prisma.plan.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const updated = await prisma.plan.update({ where: { id: params.id }, data: parsed.data });
  const { ip, userAgent } = getRequestInfo(req);
  await audit({ userId: user?.id, action: "UPDATE", entity: "Plan", entityId: updated.id, before, after: updated, ipAddress: ip, userAgent });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { error, user } = await requireRole("ADMIN");
  if (error) return error;

  const before = await prisma.plan.findUnique({
    where: { id: params.id },
    include: {
      subscriptions: {
        include: { client: { select: { id: true, firstName: true, lastName: true, email: true } } },
      },
    },
  });
  if (!before) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  // Cascada manual: borrar las suscripciones asociadas primero.
  // Los pagos conservan su registro histórico (Payment.subscriptionId se pone en NULL
  // automáticamente por `onDelete: SetNull` en el schema).
  const cascaded = before.subscriptions.length;
  await prisma.$transaction(async (tx) => {
    if (cascaded > 0) {
      await tx.subscription.deleteMany({ where: { planId: before.id } });
    }
    await tx.plan.delete({ where: { id: before.id } });
  });

  const { ip, userAgent } = getRequestInfo(req);
  // Log del plan con el estado completo (incluye subs borradas)
  await audit({
    userId: user?.id,
    action: "DELETE",
    entity: "Plan",
    entityId: before.id,
    before,
    ipAddress: ip,
    userAgent,
  });
  // Log individual por cada suscripción borrada en cascada, para trazabilidad fina
  for (const sub of before.subscriptions) {
    await audit({
      userId: user?.id,
      action: "DELETE",
      entity: "Subscription",
      entityId: sub.id,
      before: { ...sub, __reason: `Cascada por borrado del plan ${before.name}` },
      ipAddress: ip,
      userAgent,
    });
  }

  return NextResponse.json({ ok: true, cascadedSubscriptions: cascaded });
}
