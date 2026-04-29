import { getServerSession } from "next-auth";
import type { RoleName } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

export function hasRole(roles: RoleName[] | undefined, required: RoleName | RoleName[]): boolean {
  if (!roles || roles.length === 0) return false;
  const req = Array.isArray(required) ? required : [required];
  return req.some((r) => roles.includes(r));
}

/**
 * Guard para API routes. Retorna NextResponse con 401/403 o null si autorizado.
 */
export async function requireRole(required: RoleName | RoleName[]) {
  const user = await getCurrentUser();
  if (!user) {
    return {
      user: null,
      error: NextResponse.json({ error: "No autenticado" }, { status: 401 }),
    };
  }
  if (!hasRole(user.roles, required)) {
    return {
      user,
      error: NextResponse.json({ error: "No autorizado" }, { status: 403 }),
    };
  }
  return { user, error: null as null };
}

export const ADMIN_OR_INV: RoleName[] = ["ADMIN", "INVENTARIO"];
