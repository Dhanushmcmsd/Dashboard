import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { AppRole } from "@/types";

/**
 * Edge middleware — runs before every matched request.
 *
 * Route protection:
 *   /admin/*              → super_admin only
 *   /:companySlug/*       → company_admin or employee (company-scoped)
 *   /api/*                → any authenticated session
 *     except /api/auth/*  — NextAuth own routes (always public)
 *     except /api/health  — uptime checks
 *
 * Login redirect targets:
 *   super_admin   → /admin
 *   others        → /:companySlug (from token.companySlug)
 *
 * Note: isActive liveness check is handled inside requireAuth() / withCompanyScope()
 * in each API route handler. Edge middleware cannot call Prisma (no Node.js runtime).
 */
export default withAuth(
  function middleware(req: NextRequest) {
    const token       = (req as any).nextauth?.token;
    const role        = token?.role        as AppRole | undefined;
    const companySlug = token?.companySlug as string  | undefined;
    const pathname    = req.nextUrl.pathname;

    // ── /admin/* — super_admin only ─────────────────────────────────────────
    if (pathname.startsWith("/admin")) {
      if (role !== "super_admin") {
        // Non-super_admin users get redirected to their own dashboard
        const dest = companySlug ? `/${companySlug}` : "/login";
        return NextResponse.redirect(new URL(dest, req.url));
      }
    }

    // ── /:companySlug/* — company_admin or employee ──────────────────────────
    // Match paths like /acme-corp/... but exclude known top-level routes
    const companyRouteMatch = pathname.match(/^\/([a-z0-9-]+)(\/.*)?$/);
    const reservedRoutes    = new Set(["admin", "login", "signup", "api", "_next", "public"]);

    if (companyRouteMatch && !reservedRoutes.has(companyRouteMatch[1])) {
      const routeSlug = companyRouteMatch[1];

      // super_admin can access any company slug
      if (role === "super_admin") return NextResponse.next();

      // company_admin and employee must own this slug
      if (!companySlug || companySlug !== routeSlug) {
        return NextResponse.redirect(new URL("/login", req.url));
      }

      // employee can only access upload routes under /:companySlug/upload/*
      if (role === "employee") {
        const subPath = companyRouteMatch[2] ?? "/";
        if (!subPath.startsWith("/upload") && subPath !== "/") {
          return NextResponse.redirect(new URL(`/${companySlug}/upload`, req.url));
        }
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      /**
       * Return true to allow the request to proceed to the middleware function.
       * Return false to redirect to the signIn page automatically.
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
