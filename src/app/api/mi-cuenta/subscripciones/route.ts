import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/rbac";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const client = await prisma.client.findFirst({ where: { userId: user.id } });
  if (!client) return NextResponse.json([]);
  const subs = await prisma.subscription.findMany({
    where: { clientId: client.id, status: "ACTIVA" },
    include: { plan: true },
  });
  return NextResponse.json(subs);
}
