import { NextResponse } from "next/server";
import { ADMIN_OR_INV, requireRole } from "@/lib/rbac";
import { getCampaignMetrics, getProductBreakdownByCampaign } from "@/lib/marketing/metrics";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireRole(ADMIN_OR_INV);
  if (error) return error;

  const [metrics, breakdown] = await Promise.all([
    getCampaignMetrics(params.id),
    getProductBreakdownByCampaign(params.id),
  ]);

  return NextResponse.json({ metrics, breakdown });
}
