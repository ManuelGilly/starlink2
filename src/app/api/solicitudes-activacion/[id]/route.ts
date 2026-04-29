import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/rbac";

const patchSchema = z.object({
  status: z.enum(["PROCESADA", "RECHAZADA"]),
  reviewNotes: z.string().max(1000).optional().nullable(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (!user.roles.includes("ADMIN")) {
    return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
  }

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.planRequest.update({
    where: { id: params.id },
    data: {
      status: parsed.data.status,
      reviewNotes: parsed.data.reviewNotes ?? undefined,
      reviewedAt: new Date(),
      reviewedBy: user.id,
    },
  });

  return NextResponse.json(updated);
}
