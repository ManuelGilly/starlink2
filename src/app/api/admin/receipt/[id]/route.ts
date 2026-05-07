import { NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { prisma } from "@/lib/db";
import { requireRole, ADMIN_OR_INV } from "@/lib/rbac";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireRole(ADMIN_OR_INV);
  if (error) return error;

  const request = await prisma.planRequest.findUnique({
    where: { id: params.id },
    select: { receiptUrl: true },
  });
  if (!request?.receiptUrl) {
    return NextResponse.json({ error: "Comprobante no encontrado" }, { status: 404 });
  }

  const result = await get(request.receiptUrl, {
    access: "private",
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  if (!result || result.statusCode !== 200) {
    return NextResponse.json({ error: "Comprobante no disponible" }, { status: 404 });
  }

  const headers = new Headers();
  headers.set("content-type", result.blob.contentType);
  headers.set("content-length", String(result.blob.size));
  if (result.blob.contentDisposition) headers.set("content-disposition", result.blob.contentDisposition);
  headers.set("cache-control", "private, max-age=0, must-revalidate");

  return new Response(result.stream, { headers });
}
