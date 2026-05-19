import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ADMIN_OR_INV, requireRole } from "@/lib/rbac";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireRole(ADMIN_OR_INV);
  if (error) return error;

  const notes = await prisma.clientNote.findMany({
    where: { clientId: params.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(notes);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { error, user } = await requireRole(ADMIN_OR_INV);
  if (error) return error;

  const parsed = z.object({ content: z.string().min(1) }).safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Contenido requerido" }, { status: 400 });

  const note = await prisma.clientNote.create({
    data: {
      clientId: params.id,
      content: parsed.data.content,
      authorId: user?.id ?? undefined,
    },
  });

  return NextResponse.json(note, { status: 201 });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireRole(["ADMIN"]);
  if (error) return error;

  const url = new URL(req.url);
  const noteId = url.searchParams.get("noteId");
  if (!noteId) return NextResponse.json({ error: "noteId requerido" }, { status: 400 });

  await prisma.clientNote.deleteMany({ where: { id: noteId, clientId: params.id } });
  return new NextResponse(null, { status: 204 });
}
