import { randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
]);
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

function extFromMime(mime: string): string {
  switch (mime) {
    case "image/jpeg":
    case "image/jpg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/heic":
      return "heic";
    case "image/heif":
      return "heif";
    case "application/pdf":
      return "pdf";
    default:
      return "bin";
  }
}

export type UploadResult = { url: string; filename: string; size: number };

export async function saveReceiptFile(file: File, subdir = "receipts"): Promise<UploadResult> {
  if (!file || typeof file === "string") throw new Error("Archivo requerido");
  if (file.size <= 0) throw new Error("Archivo vacío");
  if (file.size > MAX_BYTES) throw new Error("Archivo excede 8 MB");
  if (!ALLOWED_MIME.has(file.type)) throw new Error("Tipo de archivo no permitido");

  const ext = extFromMime(file.type);
  const rand = randomBytes(10).toString("hex");
  const ts = Date.now();
  const filename = `${ts}-${rand}.${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`${subdir}/${filename}`, file, {
      access: "public",
      contentType: file.type,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return { url: blob.url, filename, size: file.size };
  }

  const uploadsRoot = path.join(process.cwd(), "public", "uploads", subdir);
  await mkdir(uploadsRoot, { recursive: true });
  const destPath = path.join(uploadsRoot, filename);
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(destPath, buf);

  return {
    url: `/uploads/${subdir}/${filename}`,
    filename,
    size: file.size,
  };
}
