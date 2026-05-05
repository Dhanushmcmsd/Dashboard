import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Edge middleware — runs before every matched request.
 *
 * Protected path groups:
 *   /admin/*        → ADMIN, SUPER_ADMIN
 *   /employee/*     → EMPLOYEE
 *   /management/*   → MANAGEMENT, SUPER_ADMIN
 *   /api/*          → any authenticated session
 *     (except /api/auth/* — NextAuth own routes, always public)
 *     (except /api/health  — uptime checks)
 *
 * Behavior:
 *   - No session           → redirect to /login
 *   - Wrong role for path  → redirect to their own dashboard
 *   - Static assets, public pages → untouched
 *
 * Note: isActive liveness check is handled in requireAuth() inside each
 * API route handler. Edge middleware cannot call Prisma (no Node.js runtime).
 */
export default withAuth(
  function middleware(req: NextRequest) {
    const token    = (req as any).nextauth?.token;
    const role     = token?.role as string | undefined;
    const pathname = req.nextUrl.pathname;

    // ── Role-based path gating ──────────────────────────────────────────────

    // /admin/* — only ADMIN or SUPER_ADMIN
    if (pathname.startsWith("/admin")) {
      if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }

    // /employee/* — only EMPLOYEE
    if (pathname.startsWith("/employee")) {
      if (role !== "EMPLOYEE" && role !== "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }

    // /management/* — only MANAGEMENT or SUPER_ADMIN
    if (pathname.startsWith("/management")) {
      if (role !== "MANAGEMENT" && role !== "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }

    // All other matched paths — authenticated only (no role restriction)
    return NextResponse.next();
  },
  {
    callbacks: {
      /**
       * Return true to allow the request to proceed to the middleware function.
       * Return false to redirect to the signIn page automatically.
       * We return !!token so any unauthenticated request hits the login redirect.
       */
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static  (static files)
     * - _next/image   (image optimisation)
     * - favicon.ico
     * - /login        (public sign-in page)
     * - /signup       (public registration)
     * - /forgot-password, /reset-password, /set-password (public auth flows)
     * - /api/auth/*   (NextAuth own endpoints — must stay public)
     * - /api/health   (uptime probe — no auth needed)
     */
    "/((?!_next/static|_next/image|favicon.ico|login|signup|forgot-password|reset-password|set-password|api/auth|api/health).*)",
  ],
};
