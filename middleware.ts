import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const rol = token.rol as string;

    // Rutas de Jefatura
    if (path.startsWith("/jefatura") && rol !== "JEFATURA" && rol !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Rutas de Personal
    if (path.startsWith("/personal") && rol !== "PERSONAL" && rol !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Rutas de Admin
    if (path.startsWith("/admin") && rol !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Rutas de planillas (Jefe de Sección)
    if (
      path.startsWith("/planillas") &&
      rol !== "JEFE_SECCION" &&
      rol !== "ADMIN"
    ) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/planillas/:path*",
    "/jefatura/:path*",
    "/personal/:path*",
    "/admin/:path*",
    "/perfil/:path*",
  ],
};
