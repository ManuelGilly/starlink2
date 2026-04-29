import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";

export async function GET(req: Request) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const url = new URL(req.url);
  const entity = url.searchParams.get("entity");
  const action = url.searchParams.get("action");
  const userId = url.searchParams.get("userId");
  const entityId = url.searchParams.get("entityId");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const take = Math.min(Number(url.searchParams.get("take") ?? 100), 500);

  const where: any = {};
  if (entity) where.entity = entity;
  if (action) where.action = action;
  if (userId) where.userId = userId;
  if (entityId) where.entityId = entityId;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }

  const logs = await prisma.auditLog.findMany({
    where,
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take,
  });
  return NextResponse.json(logs);
}
