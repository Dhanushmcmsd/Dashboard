# MODULE BREAKDOWN — Supra Pacific Dashboard

> One section per major module. Keep this updated as modules are added or refactored.

---

## 1. `lib/auth.ts` — NextAuth Configuration

**Purpose:** Central NextAuth v4 config. Defines the CredentialsProvider (email + bcrypt password verify), JWT callback (injects `id`, `role`, `isActive`, `branches`, `organizationId`), session callback, and sign-in error handling.

**Key Files:**
- `lib/auth.ts` — NextAuth options object
- `lib/auth-guard.ts` — `requireAuth(req, roles?)` server-side helper used in every API route
- `lib/with-auth.ts` — Higher-order route handler wrapper
- `next-auth.d.ts` — Type augmentation for Session + JWT
- `middleware.ts` — Edge middleware; role-based path gating

**External Dependencies:** `next-auth ^4.24.14`, `bcryptjs ^3.0.3`

**Test Surface:**
- Unit: password verify logic, JWT shape after sign-in
- Integration: `requireAuth` rejects unauthenticated request
- Manual: sign in with each role, verify redirect destination

---

## 2. `lib/prisma.ts` — Database Client

**Purpose:** Singleton `PrismaClient` instance. Dev-safe (reuses global instance across HMR). Only import point for Prisma across the entire app.

**Key Files:**
- `lib/prisma.ts` — singleton export
- `prisma/schema.prisma` — data model definitions
- `prisma/seed.ts` — idempotent dev seed
- `prisma/migrations/` — migration history

**External Dependencies:** `@prisma/client ^5.22.0`, `prisma ^5.22.0`, `DATABASE_URL` env var (Neon/Supabase PostgreSQL)

**Test Surface:**
- Unit: not practical (DB-bound)
- Integration: seed runs idempotently; each model CRUD roundtrip
- Manual: `npm run db:studio` to verify data

---

## 3. `app/api/` — API Route Handlers

**Purpose:** Next.js App Router route handlers (server-side HTTP endpoints). All protected routes call `requireAuth()` from `lib/auth-guard.ts` before any Prisma query.

**Key Routes:**

| Route | Method(s) | Auth Required | Purpose |
|---|---|---|---|
| `/api/auth/[...nextauth]` | GET, POST | No | NextAuth sign-in/out/session |
| `/api/signup` | POST | No | New user registration |
| `/api/users` | GET, POST, PATCH, DELETE | Yes | User CRUD |
| `/api/upload` | POST | Yes (EMPLOYEE+) | File upload |
| `/api/dashboard` | GET | Yes | Single dashboard data fetch |
| `/api/dashboards` | GET, POST, PATCH, DELETE | Yes | Dashboard layout CRUD |
| `/api/alerts` | GET, POST | Yes | Alert management |
| `/api/audit` | GET | Yes (ADMIN+) | Audit log read |
| `/api/export` | POST | Yes | Excel/PDF export |
| `/api/events` | POST | Yes | Pusher event dispatch |
| `/api/pusher` | POST | Yes | Pusher channel auth |
| `/api/cron` | GET | CRON_SECRET header | Scheduled snapshot generation |
| `/api/health` | GET | No | Uptime probe |

**External Dependencies:** All above modules; Zod for input validation (partial — see gaps)

**Test Surface:**
- Unit: input validation schema (Zod)
- Integration: authenticated request → correct Prisma query → correct response shape
- Manual: each endpoint with Postman/curl

---

## 4. `lib/excel-parser.ts` + `lib/html-parser.ts` — File Parsers

**Purpose:** Parse uploaded Excel (`.xlsx`) and HTML files into structured JSON. `excel-parser.ts` uses ExcelJS to read sheets. `html-parser.ts` uses `node-html-parser` to extract table data.

**Key Files:**
- `lib/excel-parser.ts` — 19 KB; handles multi-sheet workbooks
- `lib/html-parser.ts` — 3 KB; HTML table extractor

**External Dependencies:** `exceljs ^4.4.0`, `node-html-parser ^7.1.0`

**Test Surface:**
- Unit: given fixture `.xlsx` → expected JSON shape
- Unit: given fixture HTML string → expected table array
- Edge cases: empty sheet, missing required column, merged cells

---

## 5. `lib/snapshot-generator.ts` — Snapshot Engine

**Purpose:** Aggregates uploaded data across all branches for a given `dateKey` into a `DailySnapshot` or `MonthlySnapshot` record. Currently called synchronously from the upload route — flagged for async refactor.

**Key Files:**
- `lib/snapshot-generator.ts` — main aggregation logic
- `app/api/cron/` — scheduled trigger (preferred invocation path post-refactor)
- `app/api/upload/` — current synchronous invocation (to be removed)

**External Dependencies:** `lib/prisma.ts`

**Risk:** ⚠️ Synchronous invocation from upload route risks Vercel 10s function timeout on large files. **Fix in Step 7.1.**

**Test Surface:**
- Unit: `generateDailySnapshot(dateKey)` with mocked Prisma returns expected combinedData shape
- Integration: upload → cron trigger → snapshot record created

---

## 6. `lib/email.ts` — Email Service

**Purpose:** Resend-based email utilities. Provides typed wrappers for transactional emails: password reset, welcome/set-password invite, alert notifications.

**Key Files:**
- `lib/email.ts` — 21 KB; all email templates inline as HTML strings

**External Dependencies:** `resend ^6.12.2`, `RESEND_API_KEY` + `RESEND_FROM_EMAIL` env vars

**Test Surface:**
- Unit: template string rendering with test data
- Manual: trigger reset-password flow; verify email received in inbox

---

## 7. `lib/events.ts` — Real-time Events

**Purpose:** Thin wrapper around Pusher server SDK. Provides `triggerEvent(channel, event, data)` for pushing real-time updates to connected clients (alert broadcasts, upload status changes).

**Key Files:**
- `lib/events.ts` — Pusher server trigger helpers
- `app/api/pusher/` — Pusher channel authentication endpoint

**External Dependencies:** `pusher ^5.3.3` (server), `pusher-js ^8.5.0` (client); `PUSHER_APP_ID`, `PUSHER_SECRET`, `NEXT_PUBLIC_PUSHER_KEY`, `NEXT_PUBLIC_PUSHER_CLUSTER` env vars

**Test Surface:**
- Manual: send alert → verify real-time badge update in browser without refresh

---

## 8. `lib/rate-limit.ts` — Rate Limiter

**Purpose:** In-memory LRU-cache based rate limiter for API routes. Applied to auth endpoints (login, signup, forgot-password) to prevent brute-force attacks. Serverless-safe (per-instance; not distributed).

**Key Files:**
- `lib/rate-limit.ts` — single file

**External Dependencies:** `lru-cache ^10.4.3`

**Limitation:** Not shared across Vercel Edge instances. For distributed rate limiting, replace with Upstash Redis in Step 9.3.

**Test Surface:**
- Unit: exceed limit → 429 response

---

## 9. `lib/audit.ts` — Audit Logger

**Purpose:** Writes `AuditLog` records to the database for every meaningful user action (upload, user create/deactivate, alert send, etc.). Called explicitly from within API route handlers.

**Key Files:**
- `lib/audit.ts` — `logAudit(userId, action, resource, resourceId?, metadata?, ipAddress?)` function

**External Dependencies:** `lib/prisma.ts`

**Test Surface:**
- Unit: `logAudit()` call → verify `AuditLog` record created with correct fields

---

## 10. `components/` — UI Components

**Purpose:** React component library for the dashboard. Currently not fully enumerated — audit in Step 2.1.

**Key Directories (expected):**
- `components/ui/` — Primitive components (Button, Input, Modal, Badge, etc.)
- `components/dashboard/` — Widget and layout section components
- `components/auth/` — Login and form components
- `components/shared/` — Navbar, Sidebar, Breadcrumb

**External Dependencies:** `lucide-react ^1.14.0`, `recharts ^3.8.1`, `react-grid-layout ^1.5.0`, `sonner ^2.0.7`, `class-variance-authority`, `clsx`, `tailwind-merge`

**Test Surface:**
- Step 2.1: inventory and audit all components
- Unit (post-audit): snapshot tests for key UI primitives

---

## 11. `hooks/` — Custom React Hooks

**Purpose:** Client-side data fetching and UI state hooks. TanStack Query is the primary data-fetching library. SWR also present (redundant — to be removed in Step 7 of migration).

**Key Files:** Not fully enumerated — audit in Step 2.1.

**External Dependencies:** `@tanstack/react-query ^5.100.6`, `swr ^2.3.3` (to be removed)

**Test Surface:**
- Unit: hook returns correct loading/data/error states given mocked fetch

---

## 12. `middleware.ts` — Edge Middleware

**Purpose:** Next.js Edge Middleware running before every matched request. Enforces authentication (redirect to `/login` if no session) and role-based path access (ADMIN → `/admin/*`, EMPLOYEE → `/employee/*`, MANAGEMENT → `/management/*`). Does NOT call Prisma (no Node.js runtime in Edge).

**Key Files:**
- `middleware.ts` — `withAuth` wrapper + role-gate logic + `config.matcher`

**External Dependencies:** `next-auth/middleware`

**Test Surface:**
- Manual: access protected route without session → redirected to `/login`
- Manual: access `/admin` as EMPLOYEE → redirected to `/login`
