import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import { verify } from "jsonwebtoken";
import type { RoleName } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

type MobileTokenPayload = {
  userId: string;
  email: string;
  name: string;
  roles: RoleName[];
};

export async function getCurrentUser() {
  // 1. Sesión NextAuth (web — cookie)
  const session = await getServerSession(authOptions);
  if (session?.user) return session.user;

  // 2. Bearer JWT (mobile)
  const auth = headers().get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice(7);
    try {
      const secret = process.env.NEXTAUTH_SECRET;
      if (!secret) return null;
      const payload = verify(token, secret) as MobileTokenPayload;
      return {
        id: payload.userId,
        email: payload.email,
        name: payload.name,
        roles: payload.roles,
        mustChangePassword: false,
      };
    } catch {
      return null;
    }
  }

  return null;
}

export function hasRole(roles: RoleName[] | undefined, required: RoleName | RoleName[]): boolean {
  if (!roles || roles.length === 0) return false;
  const req = Array.isArray(required) ? required : [required];
  return req.some((r) => roles.includes(r));
}

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
