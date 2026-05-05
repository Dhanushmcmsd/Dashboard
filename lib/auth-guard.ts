import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";
import { prisma } from "@/lib/prisma";
import type { AppRole, SessionUser } from "@/types";

// ---------------------------------------------------------------------------
// Return-type helpers
// ---------------------------------------------------------------------------

type AuthError  = { error: string; status: number; user?: never };
type AuthOk     = { error?: never; status?: never; user: SessionUser };
type AuthResult = AuthError | AuthOk;

// ---------------------------------------------------------------------------
// requireAuth
// ---------------------------------------------------------------------------

/**
 * Validates that a session exists, the user is still active in the DB,
 * and (optionally) the user's role is in the allowedRoles list.
 *
 * super_admin is always included implicitly — they have platform-wide access.
 *
 * @param allowedRoles  Omit to allow any authenticated user.
 *                      Pass ["company_admin"] to restrict to company_admin + super_admin.
 */
export async function requireAuth(allowedRoles?: AppRole[]): Promise<AuthResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return { error: "Unauthorized", status: 401 };
  }

  const user = session.user as SessionUser;

  // Always verify liveness in DB — catches deactivated-while-logged-in
  const dbUser = await prisma.user.findUnique({
    where:  { id: user.userId },
    select: { isActive: true },
  });

  if (!dbUser || !dbUser.isActive) {
    return { error: "Account is deactivated", status: 401 };
  }

  // Role check — super_admin is always allowed through
  if (allowedRoles && allowedRoles.length > 0) {
    const isSuperAdmin = user.role === "super_admin";
    const roleAllowed  = allowedRoles.includes(user.role);
    if (!isSuperAdmin && !roleAllowed) {
      return { error: "Forbidden", status: 403 };
    }
  }

  return { user };
}

// ---------------------------------------------------------------------------
// requireCompanyScope  (legacy alias — prefer withCompanyScope from lib/with-company-scope.ts)
// ---------------------------------------------------------------------------

type ScopeError  = { error: string; status: number; user?: never };
type ScopeOk     = { error?: never; status?: never; user: SessionUser };
type ScopeResult = ScopeError | ScopeOk;

/**
 * Extends requireAuth() with company-boundary enforcement.
 *
 * Prefer withCompanyScope() in lib/with-company-scope.ts for server actions
 * and route handlers — it accepts a slug instead of an ID.
 *
 * @param user          The SessionUser from a successful requireAuth() call.
 * @param targetCompanyId   The company ID the route is operating on.
 */
export async function requireCompanyScope(
  user: SessionUser,
  targetCompanyId: string
): Promise<ScopeResult> {
  if (user.role === "super_admin") return { user };

  if (!user.companyId) {
    return {
      error:  "No company assigned to this account. Contact your administrator.",
      status: 403,
    };
  }

  if (user.companyId !== targetCompanyId) {
    return { error: "Forbidden: cross-company access denied", status: 403 };
  }

  return { user };
}
