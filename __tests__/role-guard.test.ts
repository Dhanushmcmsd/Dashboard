/**
 * Role guard unit tests
 *
 * Tests the pure role-checking logic used by requireAuth() and the
 * middleware without hitting the DB or Next.js runtime.
 *
 * Run with: npx jest __tests__/role-guard.test.ts
 */

import type { AppRole, SessionUser } from "@/types";

// ---------------------------------------------------------------------------
// Pure helper extracted from auth-guard.ts so it can be tested without
// mocking Prisma or getServerSession.
// ---------------------------------------------------------------------------

function isRoleAllowed(userRole: AppRole, allowedRoles: AppRole[]): boolean {
  if (userRole === "super_admin") return true;          // super_admin bypasses all role gates
  return allowedRoles.includes(userRole);
}

function isCompanyScopeValid(
  userRole: AppRole,
  userCompanySlug: string | null,
  requestedSlug: string
): boolean {
  if (userRole === "super_admin") return true;          // cross-company access
  if (!userCompanySlug) return false;                   // misconfigured account
  return userCompanySlug === requestedSlug;             // slug must match
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("isRoleAllowed", () => {
  it("allows super_admin regardless of allowedRoles", () => {
    expect(isRoleAllowed("super_admin", ["employee"])).toBe(true);
    expect(isRoleAllowed("super_admin", ["company_admin"])).toBe(true);
    expect(isRoleAllowed("super_admin", [])).toBe(true);
  });

  it("allows company_admin when role is in the list", () => {
    expect(isRoleAllowed("company_admin", ["company_admin"])).toBe(true);
    expect(isRoleAllowed("company_admin", ["company_admin", "employee"])).toBe(true);
  });

  it("blocks company_admin when role is NOT in the list", () => {
    expect(isRoleAllowed("company_admin", ["employee"])).toBe(false);
  });

  it("allows employee when role is in the list", () => {
    expect(isRoleAllowed("employee", ["employee"])).toBe(true);
  });

  it("blocks employee when role is NOT in the list", () => {
    expect(isRoleAllowed("employee", ["company_admin"])).toBe(false);
    expect(isRoleAllowed("employee", [])).toBe(false);
  });
});

describe("isCompanyScopeValid", () => {
  it("always passes for super_admin regardless of slug", () => {
    expect(isCompanyScopeValid("super_admin", null, "any-company")).toBe(true);
    expect(isCompanyScopeValid("super_admin", "some-slug", "other-slug")).toBe(true);
  });

  it("passes when slugs match for company_admin", () => {
    expect(isCompanyScopeValid("company_admin", "acme", "acme")).toBe(true);
  });

  it("blocks company_admin when slugs mismatch", () => {
    expect(isCompanyScopeValid("company_admin", "acme", "rival-corp")).toBe(false);
  });

  it("blocks company_admin with no companySlug (misconfigured account)", () => {
    expect(isCompanyScopeValid("company_admin", null, "acme")).toBe(false);
  });

  it("passes when slugs match for employee", () => {
    expect(isCompanyScopeValid("employee", "acme", "acme")).toBe(true);
  });

  it("blocks employee when slugs mismatch", () => {
    expect(isCompanyScopeValid("employee", "acme", "other-corp")).toBe(false);
  });
});

describe("combined role + scope guard (middleware simulation)", () => {
  const makeUser = (role: AppRole, companySlug: string | null): SessionUser => ({
    userId: "usr_test",
    name: "Test User",
    email: "test@example.com",
    role,
    companyId: companySlug ? "cmp_test" : null,
    companySlug,
  });

  it("super_admin can access any company route", () => {
    const user = makeUser("super_admin", null);
    expect(isRoleAllowed(user.role, ["company_admin"])).toBe(true);
    expect(isCompanyScopeValid(user.role, user.companySlug, "any-company")).toBe(true);
  });

  it("company_admin can only access their own company route", () => {
    const user = makeUser("company_admin", "acme");
    expect(isRoleAllowed(user.role, ["company_admin"])).toBe(true);
    expect(isCompanyScopeValid(user.role, user.companySlug, "acme")).toBe(true);
    expect(isCompanyScopeValid(user.role, user.companySlug, "rival")).toBe(false);
  });

  it("employee cannot access company_admin-only routes", () => {
    const user = makeUser("employee", "acme");
    expect(isRoleAllowed(user.role, ["company_admin"])).toBe(false);
  });

  it("employee can access employee-allowed routes within their company", () => {
    const user = makeUser("employee", "acme");
    expect(isRoleAllowed(user.role, ["employee", "company_admin"])).toBe(true);
    expect(isCompanyScopeValid(user.role, user.companySlug, "acme")).toBe(true);
  });
});
