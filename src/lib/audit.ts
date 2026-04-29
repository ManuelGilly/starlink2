import { prisma } from "@/lib/db";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "PASSWORD_CHANGE" | "PASSWORD_RESET" | string;

export interface AuditParams {
  userId?: string | null;
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  before?: any;
  after?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Calcula diff superficial entre dos objetos.
 * Devuelve { field: { from, to } } para campos que cambiaron.
 */
function computeDiff(before: any, after: any): Record<string, { from: any; to: any }> {
  const diff: Record<string, { from: any; to: any }> = {};
  const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);
  for (const k of keys) {
    // Ignorar campos de auditoría
    if (k === "createdAt" || k === "updatedAt" || k === "passwordHash") continue;
    const b = before?.[k];
    const a = after?.[k];
    if (JSON.stringify(serialize(b)) !== JSON.stringify(serialize(a))) {
      diff[k] = { from: serialize(b), to: serialize(a) };
    }
  }
  return diff;
}

/** Convierte Decimal/Date a JSON-safe. */
function serialize(v: any): any {
  if (v === null || v === undefined) return v;
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "object" && typeof v?.toNumber === "function") return Number(v); // Prisma Decimal
  if (Array.isArray(v)) return v.map(serialize);
  if (typeof v === "object") {
    const out: any = {};
    for (const k of Object.keys(v)) out[k] = serialize(v[k]);
    return out;
  }
  return v;
}

export async function audit(params: AuditParams) {
  const { userId, action, entity, entityId, before, after, ipAddress, userAgent } = params;
  let diff: any = null;

  if (before && after) {
    const d = computeDiff(before, after);
    diff = Object.keys(d).length ? d : null;
  } else if (before && !after) {
    // DELETE — guardar estado completo
    diff = { __deleted: serialize(before) };
  } else if (!before && after) {
    // CREATE — guardar estado creado
    diff = { __created: serialize(after) };
  }

  try {
    await prisma.auditLog.create({
      data: {
        userId: userId ?? null,
        action,
        entity,
        entityId: entityId ?? null,
        diff: diff ? (JSON.parse(JSON.stringify(diff)) as any) : undefined,
        ipAddress: ipAddress ?? undefined,
        userAgent: userAgent ?? undefined,
      },
    });
  } catch (e) {
    console.error("[audit] fallo al escribir bitácora:", e);
  }
}

export function getRequestInfo(req: Request) {
  const fwd = req.headers.get("x-forwarded-for");
  const ip = fwd ? fwd.split(",")[0].trim() : req.headers.get("x-real-ip") ?? null;
  const userAgent = req.headers.get("user-agent") ?? null;
  return { ip, userAgent };
}
