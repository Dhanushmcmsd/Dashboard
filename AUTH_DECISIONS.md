# AUTH_DECISIONS.md

Single source of truth for authentication and authorization decisions in this codebase.

---

## 1. Session Shape (TypeScript)

```ts
// next-auth.d.ts — augments the NextAuth Session type
interface Session {
  user: {
    userId:      string;        // Prisma User.id (cuid)
    email:       string;
    name:        string | null;
    role:        AppRole;       // "super_admin" | "company_admin" | "employee"
    companyId:   string | null; // Prisma Company.id  — null for super_admin
    companySlug: string | null; // URL-safe slug      — null for super_admin
  };
}

// JWT token carries the same first-class fields:
interface JWT {
  userId:      string;
  role:        AppRole;
  companyId:   string | null;
  companySlug: string | null;
}
```

**Why first-class fields (not nested metadata)?**
Edge middleware reads `token.role` and `token.companySlug` directly — nested paths
like `token.metadata.companySlug` would require extra null-guards on every read.

---

## 2. Role Model

| Role            | Scope          | Capabilities                             |
|-----------------|----------------|------------------------------------------|
| `super_admin`   | Cross-company  | All routes; admin UI; impersonate company |
| `company_admin` | Single company | Full dashboard; user management          |
| `employee`      | Single company | Upload only (`/:companySlug/upload/*`)   |

---

## 3. Route Protection Table

| Route pattern               | Required role(s)                     | Company-scoped? | Redirect on fail              |
|-----------------------------|--------------------------------------|-----------------|-------------------------------|
| `/login`                    | Public                               | No              | —                             |
| `/signup`                   | Public                               | No              | —                             |
| `/forgot-password`          | Public                               | No              | —                             |
| `/reset-password`           | Public                               | No              | —                             |
| `/set-password`             | Public                               | No              | —                             |
| `/admin/*`                  | `super_admin`                        | No              | `/:companySlug` or `/login`   |
| `/:companySlug`             | `company_admin`, `employee`, `super_admin` | Yes        | `/login`                      |
| `/:companySlug/upload/*`    | `employee`, `company_admin`, `super_admin` | Yes       | `/login`                      |
| `/:companySlug/**` (other)  | `company_admin`, `super_admin`       | Yes             | `/:companySlug/upload`        |
| `/api/*`                    | Any authenticated session            | Per handler     | `401 Unauthorized`            |
| `/api/auth/*`               | Public (NextAuth internal)           | No              | —                             |
| `/api/health`               | Public                               | No              | —                             |

---

## 4. Login Redirect Targets

Set in `lib/auth.ts` → `callbacks.redirect`:

| Role            | Redirect destination        |
|-----------------|-----------------------------|
| `super_admin`   | `/admin`                    |
| `company_admin` | `/:companySlug`             |
| `employee`      | `/:companySlug`             |

---

## 5. `withCompanyScope()` Usage Contract

**Location:** `lib/with-company-scope.ts`

**Signature:**
```ts
async function withCompanyScope(requestedCompanySlug: string): Promise<SessionUser>
```

**Rules:**
- No session → throws `Response(401)`
- `super_admin` → always passes (cross-company platform access)
- `company_admin` / `employee` with no `companySlug` → throws `Response(403)`
- `company_admin` / `employee` where `session.companySlug !== requestedCompanySlug` → throws `Response(403)`
- On success → returns `SessionUser`

**Usage pattern in route handlers:**
```ts
// app/api/[companySlug]/data/route.ts
export async function GET(req: Request, { params }: { params: { companySlug: string } }) {
  let user: SessionUser;
  try {
    user = await withCompanyScope(params.companySlug);
  } catch (e) {
    if (e instanceof Response) return e; // propagate 401/403
    throw e;
  }

  // Safe to proceed — user is verified and owns this company slug
  const data = await prisma.someModel.findMany({
    where: { companyId: user.companyId! },
  });
  return NextResponse.json(data);
}
```

**Usage pattern in server actions:**
```ts
"use server";
export async function uploadFile(companySlug: string, formData: FormData) {
  const user = await withCompanyScope(companySlug); // throws on failure
  // proceed with upload...
}
```

---

## 6. Existing Helpers (keep for compatibility)

| Helper                    | File                      | Purpose                                      |
|---------------------------|---------------------------|----------------------------------------------|
| `requireAuth(roles?)`     | `lib/auth-guard.ts`       | DB-verified session + optional role check    |
| `requireCompanyScope()`   | `lib/auth-guard.ts`       | Company ID boundary check (uses ID not slug) |
| `withAuth(handler)`       | `lib/with-auth.ts`        | API route wrapper — session check only       |
| `withRole(roles, handler)`| `lib/with-auth.ts`        | API route wrapper — session + role check     |
| `withCompanyScope(slug)`  | `lib/with-company-scope.ts` | **NEW** — slug-based tenant isolation      |

---

## 7. Test Coverage

Role guard tests live in `__tests__/role-guard.test.ts`:

- `isRoleAllowed()` — 5 cases covering all 3 roles
- `isCompanyScopeValid()` — 6 cases covering slug match, mismatch, null slug
- Combined guard simulation — 4 integration-style cases

Run tests:
```bash
npx jest __tests__/role-guard.test.ts
```
