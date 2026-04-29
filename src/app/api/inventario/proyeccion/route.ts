import { NextResponse } from "next/server";
import { ADMIN_OR_INV, requireRole } from "@/lib/rbac";
import { projectInventory } from "@/lib/inventory/projection";

export async function GET(req: Request) {
  const { error } = await requireRole(ADMIN_OR_INV);
  if (error) return error;
  const url = new URL(req.url);
  const windowDays = Number(url.searchParams.get("windowDays") ?? 30);
  const projectionDays = Number(url.searchParams.get("projectionDays") ?? 30);
  const items = await projectInventory({ windowDays, projectionDays });
  return NextResponse.json({ items, windowDays, projectionDays });
}
