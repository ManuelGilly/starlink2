import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { verifyChallengeToken } from "@/lib/challenge-token";
import { consumeCode } from "@/lib/two-factor";
import type { RoleName } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      roles: RoleName[];
      mustChangePassword: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    roles: RoleName[];
    mustChangePassword: boolean;
  }
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credenciales",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        challengeToken: { label: "Challenge", type: "text" },
        code: { label: "Code", type: "text" },
      },
      async authorize(credentials) {
        // Modo 2FA: { challengeToken, code }
        if (credentials?.challengeToken && credentials?.code) {
          const decoded = verifyChallengeToken(credentials.challengeToken, "2fa");
          if (!decoded) return null;
          const ok = await consumeCode(decoded.userId, credentials.code);
          if (!ok) return null;
          const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: { roles: { include: { role: true } } },
          });
          if (!user || !user.active) return null;
          await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            roles: user.roles.map((r) => r.role.name),
            mustChangePassword: user.mustChangePassword,
          } as any;
        }

        // Modo password: { email, password }
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
          include: { roles: { include: { role: true } } },
        });
        if (!user || !user.active) return null;

        const ok = await verifyPassword(credentials.password, user.passwordHash);
        if (!ok) return null;

        // Los admins deben pasar por el flujo 2FA: prohibir login directo por password.
        const isAdmin = user.roles.some((r) => r.role.name === "ADMIN");
        if (isAdmin) return null;

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: user.roles.map((r) => r.role.name),
          mustChangePassword: user.mustChangePassword,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.roles = (user as any).roles;
        token.mustChangePassword = (user as any).mustChangePassword;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.roles = (token.roles as RoleName[]) ?? [];
        session.user.mustChangePassword = Boolean(token.mustChangePassword);
      }
      return session;
    },
  },
};
