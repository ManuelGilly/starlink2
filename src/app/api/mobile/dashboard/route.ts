import { NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import { getDashboardData } from "@/lib/metrics";

export async function GET() {
  const { error } = await requireRole(["ADMIN", "INVENTARIO"]);
  if (error) return error;

  const data = await getDashboardData();
  return NextResponse.json(data);
}
