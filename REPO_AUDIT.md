# Repo Audit & Migration Blueprint
> Prompt 1 · Analysis-only. No code generated.  
> Generated: 2026-05-05 | Repo: `Dhanushmcmsd/Dashboard`

---

## 1. CURRENT STACK & APP STRUCTURE

| Dimension | Value |
|---|---|
| **Framework** | Next.js `^16.2.4` |
| **Router type** | `app/` (App Router) — confirmed by presence of `app/layout.tsx`, `app/page.tsx`, route groups |
| **TypeScript** | Yes — `typescript ^6.0.3`, `tsconfig.json` present, `global.d.ts`, `next-auth.d.ts` |
| **Styling** | Tailwind CSS `^4.2.4` + PostCSS; `globals.css` (12 KB); `tailwind.config.ts` |
| **Auth** | **NextAuth v4** (`next-auth ^4.24.14`) — Credentials provider (email+password via bcryptjs); JWT session strategy inferred from edge middleware use of `withAuth`; custom `next-auth.d.ts` type augmentation adds `role`, `id`, `isActive`, `branches`, `organizationId` to token/session |
| **Database** | PostgreSQL via **Prisma ORM** `^5.22.0`; Neon/Supabase-compatible; `DATABASE_URL` env var |
| **Real-time** | Pusher (server `^5.3.3` + client `pusher-js ^8.5.0`) |
| **Email** | Resend `^6.12.2` |
| **Data fetching (client)** | TanStack Query `^5.100.6` + SWR `^2.3.3` (both present — potential redundancy) |
| **Export** | `exceljs ^4.4.0`, `jspdf ^2.5.2`, `html2canvas ^1.4.1` |
| **Dashboard UI** | `react-grid-layout ^1.5.0`, `recharts ^3.8.1` |
| **CI/CD** | Vercel (`vercel.json` present); no GitHub Actions workflow detected in `.github/` |
| **Module type** | `"type": "module"` in package.json (ESM) |

### Auth Implementation Detail
- `lib/auth.ts` — NextAuth config (CredentialsProvider, bcryptjs password verify, role+branch injection into JWT)
- `lib/auth-guard.ts` — server-side `requireAuth()` helper used inside API routes
- `lib/with-auth.ts` — route handler wrapper
- `middleware.ts` — Edge middleware (`withAuth`) for path-level role gating:
  - `/admin/*` → ADMIN, SUPER_ADMIN only
  - `/employee/*` → EMPLOYEE, SUPER_ADMIN only
  - `/management/*` → MANAGEMENT, SUPER_ADMIN only
  - `/api/auth/*`, `/api/health`, public auth pages → excluded from matcher

### Prisma Schema Summary

| Model | Key Fields | Relations |
|---|---|---|
| `Organization` | id, name, slug, logoUrl, brandColor, isActive | → User[] |
| `User` | id, name, email, password, role (enum), branches[], isActive, passwordSet, organizationId | → Alert[], Upload[], AuditLog[], PasswordResetToken[], DashboardLayout[] |
| `PasswordResetToken` | id, userId, tokenHash, expiresAt, usedAt | → User |
| `Upload` | id, branch, fileType (EXCEL/HTML), fileName, rawData, htmlContent, uploadedBy, dateKey, monthKey | → User |
| `DailySnapshot` | id, dateKey (unique), combinedData, missingBranches, isBuilding | — |
| `MonthlySnapshot` | id, monthKey (unique), combinedData | — |
| `Alert` | id, message, sentBy, sentAt | → User |
| `AuditLog` | id, userId, action, resource, resourceId, metadata, ipAddress | → User |
| `DashboardLayout` | id, userId, name, layout (JSON), widgets (JSON), isShared | → User |
| `playing_with_neon` | id, name, value | — (test table, should be removed) |

Enums: `Role { SUPER_ADMIN, ADMIN, MANAGEMENT, EMPLOYEE }`, `FileType { EXCEL, HTML }`

### Existing API Surface (`app/api/`)

| Route | Purpose |
|---|---|
| `/api/auth/[...nextauth]` | NextAuth catch-all |
| `/api/signup` | User registration |
| `/api/users` | User CRUD |
| `/api/upload` | File upload (Excel/HTML) |
| `/api/dashboard` | Single dashboard data |
| `/api/dashboards` | Dashboard layout CRUD |
| `/api/alerts` | Alert management |
| `/api/audit` | Audit log read |
| `/api/export` | Excel/PDF export |
| `/api/events` | SSE or Pusher event dispatch |
| `/api/pusher` | Pusher auth endpoint |
| `/api/cron` | Scheduled snapshot generation |
| `/api/seed` | DB seeding (dev only) |
| `/api/health` | Uptime probe |

### App Route Structure (`app/`)

```
app/
├── (auth)/               # Route group — likely login/signup layouts
├── admin/                # Admin dashboard views
├── employee/             # Employee dashboard views
├── management/           # Management dashboard views
├── auth/                 # Auth-related pages (error, etc.)
├── forgot-password/
├── reset-password/
├── set-password/
├── api/                  # API route handlers (above)
├── layout.tsx            # Root layout
├── page.tsx              # Root redirect (likely → /login)
├── error.tsx
├── not-found.tsx
└── globals.css
```

### CI/CD & Deployment

- **Target**: Vercel (`vercel.json` present with likely function config)
- **No GitHub Actions** detected — no `.github/workflows/` found
- **DB scripts**: `dotenv-cli` wrapping Prisma commands in `package.json` (push, seed, migrate, studio)
- **Post-install**: `prisma generate` auto-runs on deploy

---

## 2. DEPENDENCY MAP

### Critical Import Chains (tightly coupled paths)

```
lib/auth.ts
  └── imported by: lib/auth-guard.ts, lib/with-auth.ts, app/api/auth/[...nextauth]/route.ts

lib/prisma.ts (PrismaClient singleton)
  └── imported by: lib/auth.ts, lib/auth-guard.ts, lib/audit.ts,
                   lib/snapshot-generator.ts, ALL app/api/* route handlers

lib/auth-guard.ts (requireAuth)
  └── imported by: virtually all protected app/api/* handlers

lib/audit.ts (logAudit)
  └── imported by: app/api/upload, app/api/users, app/api/alerts, app/api/auth flows

lib/email.ts (Resend wrappers)
  └── imported by: app/api/signup, app/api/auth (reset-password, set-password flows)

lib/excel-parser.ts + lib/html-parser.ts
  └── imported by: app/api/upload only

lib/snapshot-generator.ts
  └── imported by: app/api/cron, app/api/upload (post-upload trigger)

lib/events.ts (Pusher trigger wrappers)
  └── imported by: app/api/alerts, app/api/upload
```

### Shared State Patterns

- **No global client state manager** (no Zustand, Redux, Jotai found)
- **Server state**: TanStack Query `^5.100.6` (primary) + SWR `^2.3.3` (secondary — likely redundant)
- **Session state**: NextAuth `useSession()` client hook
- `lib/query-client.ts` — TanStack QueryClient singleton for React Query provider
- `hooks/` directory exists — custom hooks (useDebounce, useUpload, etc. — not fully enumerated)

### Tight Coupling Flags

| Coupling | Risk |
|---|---|
| `lib/prisma.ts` → everything | Single point of failure; already uses singleton pattern (OK) |
| `lib/auth-guard.ts` in every API route | Good pattern but must stay in sync if auth shape changes |
| `lib/snapshot-generator.ts` called synchronously from `/api/upload` | Risk of timeout on large files; should be queued |
| SWR + React Query both present | Redundant data-fetching; pick one for consistency |

---

## 3. REUSE / REPLACE / REMOVE DECISIONS

| Module/Folder | Decision | Confidence | Rationale |
|---|---|---|---|
| `lib/auth.ts` | **REUSE** | High | Complete NextAuth v4 Credentials config; bcryptjs verify in place |
| `lib/auth-guard.ts` | **REUSE** | High | `requireAuth()` pattern is solid; reuse across all API routes |
| `middleware.ts` | **REUSE** | High | Edge middleware with role gating is correct and complete |
| `lib/prisma.ts` | **REUSE** | High | Singleton PrismaClient, dev-safe |
| `prisma/schema.prisma` | **REUSE + EXTEND** | High | Models are well-designed; only remove `playing_with_neon` test table |
| `lib/email.ts` | **REUSE** | High | Resend integration, templates present |
| `lib/excel-parser.ts` | **REUSE** | Medium | Large file (19 KB) — functionally complete but not tested for edge cases |
| `lib/html-parser.ts` | **REUSE** | Medium | Smaller parser, straightforward |
| `lib/snapshot-generator.ts` | **REUSE + REFACTOR** | Medium | Logic is correct; move invocation to async queue (cron-only) to avoid upload timeout |
| `lib/audit.ts` | **REUSE** | High | Lightweight; already wired to AuditLog model |
| `lib/rate-limit.ts` | **REUSE** | High | lru-cache based; serverless-safe |
| `app/api/*` handlers | **REUSE** | Medium | All present; review each for missing input validation (Zod) |
| `lib/events.ts` | **REUSE** | Medium | Pusher wrappers; fine if Pusher stays in stack |
| `components/` | **REVIEW** | Medium | Not fully enumerated; audit for dead components before migration |
| `dashboard-app/` | **INVESTIGATE** | Low | Nested app dir at root level — unclear purpose, may be stale scaffolding |
| SWR (`swr`) | **REMOVE** | Medium | Redundant with TanStack Query; consolidate to one |
| `playing_with_neon` model | **REMOVE** | High | Test artifact from Neon setup; no app code references it |
| `.github/` | **EXTEND** | High | Add CI workflow (lint + typecheck on PR) |

---

## 4. GAPS VERSUS TECHNICAL PLAN

Based on `tech-plan-and-ai-prompt.md` in repo, the following capabilities are required but **not yet present**:

1. **Role-based UI rendering** — middleware gates routes, but granular per-component role checks (e.g. show/hide admin controls) not confirmed in `components/`
2. **Async upload processing queue** — `snapshot-generator.ts` appears called synchronously; no background job/queue system (no BullMQ, no Vercel Cron queue abstraction)
3. **Multi-tenancy enforcement at API layer** — `Organization` model exists but no confirmed `organizationId` filter in API query layer (risk of cross-org data leak)
4. **Widget data source abstraction** — `DashboardLayout.widgets` stores JSON config but no `lib/widget-data-resolver.ts` or equivalent to map widget type → data query
5. **Dashboard sharing/viewer mode** — `DashboardLayout.isShared` field present but no public viewer route or share-token logic found
6. **Zod input validation on all API routes** — `lib/validations.ts` exists (1.5 KB, likely partial) but not confirmed on all routes
7. **GitHub Actions CI** — no `.github/workflows/` present; no automated lint/typecheck/test on PR
8. **Observability** — `.env.local.example` has Sentry + PostHog commented out; not wired up
9. **Refresh token rotation** — NextAuth v4 JWT-only; no refresh token model in schema
10. **E2E / unit tests** — no test framework detected (no Jest, Vitest, Playwright config)
11. **`playing_with_neon` cleanup** — stale test model still in schema

---

## 5. RECOMMENDED TARGET STRUCTURE

Inside the existing repo — **no greenfield**:

```
/
├── app/
│   ├── (auth)/                    # KEEP — route group for login/signup
│   ├── (dashboard)/               # NEW wrapper layout for authenticated views
│   │   ├── admin/
│   │   ├── employee/
│   │   └── management/
│   ├── api/
│   │   ├── auth/[...nextauth]/
│   │   ├── users/
│   │   ├── upload/
│   │   ├── dashboard/
│   │   ├── dashboards/
│   │   ├── alerts/
│   │   ├── audit/
│   │   ├── export/
│   │   ├── events/
│   │   ├── pusher/
│   │   ├── cron/
│   │   ├── health/
│   │   └── [remove: seed/]        # REMOVE — move to prisma/seed.ts only
│   ├── forgot-password/
│   ├── reset-password/
│   ├── set-password/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                        # Primitive UI (buttons, inputs, modals)
│   ├── dashboard/                 # Widget + layout components
│   ├── auth/                      # Login/form components
│   └── shared/                    # Navbar, Sidebar, etc.
├── lib/
│   ├── auth.ts
│   ├── auth-guard.ts
│   ├── with-auth.ts
│   ├── prisma.ts
│   ├── audit.ts
│   ├── email.ts
│   ├── excel-parser.ts
│   ├── html-parser.ts
│   ├── snapshot-generator.ts
│   ├── events.ts
│   ├── rate-limit.ts
│   ├── validations.ts             # EXTEND with Zod schemas for all routes
│   ├── widget-data-resolver.ts    # NEW — maps widget type → prisma query
│   ├── org-guard.ts               # NEW — enforces organizationId isolation
│   ├── constants.ts
│   ├── types.ts
│   └── utils.ts
├── hooks/                         # KEEP + audit
├── types/                         # KEEP
├── prisma/
│   ├── schema.prisma              # Remove playing_with_neon
│   ├── migrations/
│   └── seed.ts
├── public/
├── .github/
│   └── workflows/
│       └── ci.yml                 # NEW — lint + typecheck
├── middleware.ts
├── next.config.mjs
├── vercel.json
├── tailwind.config.ts
├── tsconfig.json
└── .env.local.example
```

---

## 6. PHASED MIGRATION PLAN

| # | Step Name | Goal | Input Files | Output Files | Est. Session |
|---|---|---|---|---|---|
| 1 | **Schema Cleanup** | Remove `playing_with_neon`; add any missing indexes; verify org isolation fields | `prisma/schema.prisma` | `prisma/schema.prisma`, new migration file | Small |
| 2 | **Zod Validation Layer** | Add complete Zod schemas for all API route inputs | `lib/validations.ts`, all `app/api/*/route.ts` | `lib/validations.ts` (expanded), updated route handlers | Medium |
| 3 | **Org Guard** | Add `organizationId` enforcement to all Prisma queries in API routes | All `app/api/*/route.ts`, `lib/auth-guard.ts` | `lib/org-guard.ts` (new), updated API routes | Medium |
| 4 | **Async Upload Queue** | Decouple snapshot generation from upload request | `app/api/upload/route.ts`, `lib/snapshot-generator.ts` | Refactored upload handler (fire-and-forget or cron-only snapshot) | Medium |
| 5 | **Widget Data Resolver** | Build abstraction layer mapping widget configs to data queries | `lib/types.ts`, `app/api/dashboard/route.ts` | `lib/widget-data-resolver.ts` (new) | Large |
| 6 | **Dashboard Sharing** | Add share-token generation + public viewer route | `prisma/schema.prisma`, `app/api/dashboards/`, `app/` | `DashboardLayout` schema update, new `app/share/[token]/page.tsx` | Medium |
| 7 | **SWR Consolidation** | Remove SWR; migrate all SWR hooks to TanStack Query | `hooks/`, all client components | Updated hooks, `package.json` (remove `swr`) | Medium |
| 8 | **Component Audit** | Enumerate + remove dead components; enforce ui/dashboard/auth/shared structure | `components/` | Reorganized `components/` tree | Small |
| 9 | **CI Workflow** | Add GitHub Actions lint + typecheck on every PR | `.github/` | `.github/workflows/ci.yml` | Small |
| 10 | **Observability Wiring** | Wire Sentry DSN + PostHog key from env | `app/layout.tsx`, `next.config.mjs`, `.env.local.example` | Updated layout + config | Small |
| 11 | **Test Scaffolding** | Add Vitest + Playwright; write smoke tests for auth + upload flows | Root config files | `vitest.config.ts`, `playwright.config.ts`, `tests/` | Large |
| 12 | **Production Hardening** | Review Vercel function timeouts, add security headers, rotate NEXTAUTH_SECRET | `vercel.json`, `next.config.mjs`, `middleware.ts` | Updated config files | Small |

---

## 7. RISK LIST

| Risk | Likelihood | Mitigation |
|---|---|---|
| Cross-org data leak (missing `organizationId` filter in queries) | **H** | Step 3 — build `org-guard.ts` and audit every Prisma query |
| Upload timeout from synchronous snapshot generation | **H** | Step 4 — decouple snapshot to cron-only or background trigger |
| SWR + TanStack Query cache conflicts causing stale UI | **M** | Step 7 — consolidate to TanStack Query, remove SWR |
| `playing_with_neon` migration conflict in production | **M** | Step 1 — drop via Prisma migration before any schema extension |
| NextAuth v4 → v5 breaking change (if upgrade planned) | **M** | Pin at v4; plan separate upgrade sprint after migration complete |
| Vercel Edge runtime incompatibility with Prisma | **M** | Ensure all Prisma calls are in Node.js runtime routes, not edge |
| Missing Zod validation → injection / type mismatch in API routes | **M** | Step 2 — add Zod to all route handlers before adding new features |
| `dashboard-app/` directory purpose unknown — may contain conflicting config | **L** | Investigate and remove or document in Step 8 |
| No tests — regressions undetected during migration | **H** | Step 11 — add test scaffolding before Step 6+ features ship |

---

## 8. EXACT RECOMMENDED BRANCH NAME

```
feat/migration-v2-rebuild
```

> Use `main` as base. All migration steps above are PRs into `feat/migration-v2-rebuild`.  
> Final merge to `main` only after Step 12 passes CI and manual QA on staging.

---

*End of audit. No code was generated in this document.*
