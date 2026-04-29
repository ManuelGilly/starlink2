import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;
    const roles = (token?.roles as string[]) ?? [];

    const isAdminArea =
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/productos") ||
      pathname.startsWith("/planes") ||
      pathname.startsWith("/clientes") ||
      pathname.startsWith("/usuarios") ||
      pathname.startsWith("/inventario") ||
      pathname.startsWith("/notificaciones") ||
      pathname.startsWith("/bitacora") ||
      pathname.startsWith("/pagos") ||
      pathname.startsWith("/solicitudes-activacion");

    const isClientArea = pathname.startsWith("/mi-cuenta");

    if (token?.mustChangePassword && pathname !== "/cambiar-password" && pathname !== "/api/auth/change-password") {
      return NextResponse.redirect(new URL("/cambiar-password", req.url));
    }

    if (isAdminArea) {
      const ok = roles.includes("ADMIN") || roles.includes("INVENTARIO");
      if (!ok) return NextResponse.redirect(new URL("/mi-cuenta", req.url));

      // Rutas solo-admin
      const adminOnly = ["/usuarios", "/notificaciones", "/bitacora", "/solicitudes-activacion"];
      if (adminOnly.some((p) => pathname.startsWith(p)) && !roles.includes("ADMIN")) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    if (isClientArea && !roles.includes("CLIENTE") && !roles.includes("ADMIN")) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  },
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/productos/:path*",
    "/planes/:path*",
    "/clientes/:path*",
    "/usuarios/:path*",
    "/inventario/:path*",
    "/notificaciones/:path*",
    "/bitacora/:path*",
    "/pagos/:path*",
    "/solicitudes-activacion/:path*",
    "/mi-cuenta/:path*",
    "/cambiar-password",
  ],
};
