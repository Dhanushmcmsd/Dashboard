# AUTH_SECURITY.md

Authentication and authorization reference for the multi-company financial dashboard.

---

## Session Structure

After login, `session.user` contains:

```ts
{
  id:             string;        // Prisma User.id (cuid)
  name:           string;        // Display name
  email:          string;        // Login email
  role:           AppRole;       // "SUPER_ADMIN" | "ADMIN" | "MANAGEMENT" | "EMPLOYEE"
  branches:       string[];      // Assigned branch names (empty for ADMIN/MANAGEMENT)
  organizationId: string | null; // Prisma Organization.id — null for SUPER_ADMIN
}
```

**JWT token** contains the same fields (persisted across requests without DB queries):

```ts
{
  userId:         string;
  role:           AppRole;
  branches:       string[];
  organizationId: string | null;
}
```

---

## JWT → Session Flow

```
User logs in
     │
     ▼
authorize() in lib/auth.ts
  ├─ Queries DB for user (includes organizationId)
  ├─ Checks isActive + passwordSet
  └─ Returns { id, name, email, role, branches, organizationId }
     │
     ▼
jwt() callback
  └─ token.userId, token.role, token.branches, token.organizationId
     persisted into the signed JWT cookie
     │
     ▼
session() callback  (called on every getServerSession())
  └─ session.user.id             ← token.userId
     session.user.role           ← token.role
     session.user.branches       ← token.branches
     session.user.organizationId ← token.organizationId
```

---

## Roles and Access Rules

| Role | Scope | Dashboard | Upload | Users | Alerts | All Orgs |
|---|---|---|---|---|---|---|
| `SUPER_ADMIN` | Platform-wide | ✓ | — | ✓ | ✓ | ✓ |
| `ADMIN` | Own org | — | — | ✓ | ✓ | — |
| `MANAGEMENT` | Own org | ✓ | — | — | ✓ | — |
| `EMPLOYEE` | Own branches | — | ✓ | — | ✓ | — |

---

## Helper: `requireAuth()`

File: `lib/auth-guard.ts`

Use in every API route handler **before any DB access**.

```ts
import { requireAuth } from "@/lib/auth-guard";
import { errorResponse } from "@/lib/api-utils";

export async function GET(req: Request) {
  const auth = await requireAuth(["MANAGEMENT"]);
  if (auth.error) return errorResponse(auth.error, auth.status);

  // auth.user is typed as SessionUser — safe to use
  const { user } = auth;
}
```

**Behaviour:**
- Returns `{ error, status }` if unauthenticated, inactive, or wrong role
- `SUPER_ADMIN` always passes, even when not in `allowedRoles`
- Performs a live DB `isActive` check on every call

---

## Helper: `requireCompanyScope()`

File: `lib/auth-guard.ts`

Call **after** `requireAuth()` on any route that operates on org-specific data.

```ts
import { requireAuth, requireCompanyScope } from "@/lib/auth-guard";
import { errorResponse } from "@/lib/api-utils";

export async function GET(
  req: Request,
  { params }: { params: { orgId: string } }
) {
  const auth = await requireAuth(["MANAGEMENT"]);
  if (auth.error) return errorResponse(auth.error, auth.status);

  const scope = await requireCompanyScope(auth.user, params.orgId);
  if (scope.error) return errorResponse(scope.error, scope.status);

  // scope.user is the same SessionUser — org boundary verified
}
```

**Behaviour:**
- `SUPER_ADMIN` → always passes (cross-org access)
- User with no `organizationId` → blocked with 403
- `user.organizationId !== targetOrgId` → blocked with 403

---

## Middleware (Edge Protection)

File: `middleware.ts`

Runs at the CDN edge before the request reaches Next.js.

| Path | Allowed roles |
|---|---|
| `/admin/*` | `ADMIN`, `SUPER_ADMIN` |
| `/employee/*` | `EMPLOYEE`, `SUPER_ADMIN` |
| `/management/*` | `MANAGEMENT`, `SUPER_ADMIN` |
| `/api/*` | Any authenticated session |
| `/api/auth/*` | Public (NextAuth endpoints) |
| `/api/health` | Public (uptime probe) |
| `/login`, `/signup`, password flows | Public |

Unauthenticated requests → redirect to `/login`.
Wrong-role requests → redirect to `/login`.

> **Note:** The `isActive` liveness check cannot run in edge middleware
> (no Prisma/Node.js runtime). It is enforced inside every API route via
> `requireAuth()`. Page routes enforce it via session checks in layouts.

---

## Null Safety for `organizationId`

`session.user.organizationId` is typed as `string | null`.

Always guard before use:

```ts
// Safe pattern
if (!user.organizationId && user.role !== "SUPER_ADMIN") {
  return errorResponse("No organization assigned", 403);
}

// Or use requireCompanyScope() which handles this automatically
```

---

## Rotating NEXTAUTH_SECRET

1. Generate: `openssl rand -base64 32`
2. Set new value in Vercel environment variables
3. Redeploy
4. All existing sessions are immediately invalidated (users must log in again)

Recommended rotation interval: **every 90 days**.
