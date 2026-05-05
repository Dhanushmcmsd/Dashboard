import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import type { SessionUser } from "@/types";

/**
 * withCompanyScope — the single gating function for every server action
 * and route handler that touches company-specific data.
 *
 * Usage:
 *   const user = await withCompanyScope("acme-corp");
 *   // throws a Response with status 401/403 on failure
 *   // returns SessionUser on success
 *
 * Rules:
 *   - No session            → throws 401
 *   - super_admin           → always passes (cross-company access)
 *   - company_admin/employee → session.companySlug must equal requestedSlug
 *
 * Throw semantics:
 *   The function throws a plain Response so it integrates cleanly with
 *   Next.js route handlers and server actions:
 *
 *   try {
 *     const user = await withCompanyScope(params.companySlug);
 *   } catch (e) {
 *     if (e instanceof Response) return e; // propagate 401/403
 *     throw e;
 *   }
 */
export async function withCompanyScope(
  requestedCompanySlug: string
): Promise<SessionUser> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const user = session.user as SessionUser;

  // super_admin bypasses all company restrictions
  if (user.role === "super_admin") return user;

  // Non-company users (misconfigured account)
  if (!user.companySlug) {
    throw new Response(
      JSON.stringify({ error: "No company assigned to this account. Contact your administrator." }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  // Core check: session slug must match the route slug
  if (user.companySlug !== requestedCompanySlug) {
    throw new Response(
      JSON.stringify({ error: "Forbidden: cross-company access denied" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  return user;
}
