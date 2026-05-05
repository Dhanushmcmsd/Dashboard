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
 * SUPER_ADMIN is always included implicitly when allowedRoles is provided —
 * they have platform-wide access.
 *
 * @param allowedRoles  Omit to allow any authenticated user.
 *                      Pass ["ADMIN"] to restrict to ADMIN + SUPER_ADMIN.
 *
 * @example
 * const auth = await requireAuth(["MANAGEMENT"]);
 * if (auth.error) return errorResponse(auth.error, auth.status);
 * const user = auth.user; // SessionUser
 */
export async function requireAuth(allowedRoles?: AppRole[]): Promise<AuthResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return { error: "Unauthorized", status: 401 };
  }

  const user = session.user as SessionUser;

  // Always verify liveness in DB — catches deactivated-while-logged-in
  const dbUser = await prisma.user.findUnique({
    where:  { id: user.id },
    select: { isActive: true },
  });

  if (!dbUser || !dbUser.isActive) {
    return { error: "Account is deactivated", status: 401 };
  }

  // Role check — SUPER_ADMIN is always allowed through
  if (allowedRoles && allowedRoles.length > 0) {
    const isSuperAdmin   = user.role === "SUPER_ADMIN";
    const roleAllowed    = allowedRoles.includes(user.role);
    if (!isSuperAdmin && !roleAllowed) {
      return { error: "Forbidden", status: 403 };
    }
  }

  return { user };
}

// ---------------------------------------------------------------------------
// requireCompanyScope
// ---------------------------------------------------------------------------

type ScopeError  = { error: string; status: number; user?: never };
type ScopeOk     = { error?: never; status?: never; user: SessionUser };
type ScopeResult = ScopeError | ScopeOk;

/**
 * Extends requireAuth() with organization-boundary enforcement.
 *
 * Rules:
 * - SUPER_ADMIN → always allowed (cross-org platform access)
 * - All other roles → session.user.organizationId must equal targetOrgId
 *
 * Call this AFTER requireAuth() or combine with it:
 *
 * @example
 * const auth = await requireAuth(["MANAGEMENT"]);
 * if (auth.error) return errorResponse(auth.error, auth.status);
 *
 * const scope = await requireCompanyScope(auth.user, params.orgId);
 * if (scope.error) return errorResponse(scope.error, scope.status);
 *
 * @param user          The SessionUser from a successful requireAuth() call.
 * @param targetOrgId   The organization ID the route is operating on.
 */
export async function requireCompanyScope(
  user: SessionUser,
  targetOrgId: string
): Promise<ScopeResult> {
  // SUPER_ADMIN bypasses all org restrictions
  if (user.role === "SUPER_ADMIN") {
    return { user };
  }

  // Non-org users (edge case: misconfigured account) are always blocked
  if (!user.organizationId) {
    return {
      error:  "No organization assigned to this account. Contact your administrator.",
      status: 403,
    };
  }

  // Core check: session org must match the target org
  if (user.organizationId !== targetOrgId) {
    return { error: "Forbidden: cross-organization access denied", status: 403 };
  }

  return { user };
}
