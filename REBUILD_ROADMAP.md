# REBUILD ROADMAP — Supra Pacific Dashboard

> **STATUS KEY:** `todo` | `in-progress` | `done`  
> Update this file after every session. AI reads this to self-orient cold.

---

| Step | Batch | Status | Goal | Dependencies | Acceptance Criteria |
|---|---|---|---|---|---|
| 0.1 | 0 | done | Repo audit & migration blueprint | None | `REPO_AUDIT.md` produced (8 sections, no code generated) |
| 1.1 | 1 | done | Create 5 living planning docs | Step 0.1 | `REBUILD_ROADMAP.md`, `MODULE_BREAKDOWN.md`, `MIGRATION_NOTES.md`, `DATA_CONTRACTS.md`, `CHANGELOG.md` all present with full content |
| 2.1 | 2 | todo | UI component inventory & design token extraction | Step 1.1 | `DASHBOARD_UI_AUDIT.md` created; all existing components listed with reuse/replace decision |
| 3.1 | 3 | todo | Prisma schema — add new models | Step 1.1 | `schema.prisma` updated with Company, Portfolio, DataUpload, GoldLoanAccount, GoldLoanTxn, KpiSnapshot models; `SCHEMA_DECISIONS.md` created |
| 3.2 | 3 | todo | Seed data — companies, portfolios, users | Step 3.1 | Idempotent seed runs twice without error; dev DB has ≥1 company, ≥1 portfolio, ≥3 users |
| 4.1 | 4 | todo | Role-based auth with company scoping | Step 3.1 | `withCompanyScope()` helper; session fields: `userId/email/role/companyId/companySlug`; middleware updated |
| 4.2 | 4 | todo | Route shells & navigation scaffolding | Step 4.1 | All role routes return 200 with role banner; nav adapts to role |
| 4.3 | 4 | todo | Domain layer — types, interfaces, utilities | Step 1.1 | All enums/interfaces exported from `lib/domain/index.ts`; `getDateRange` / `formatCurrency` working |
| 5.1 | 5 | todo | Upload backend — validation, storage, state machine | Step 3.1 | File validated by MIME + magic bytes; status transitions enforced (pending→processing→success/failed) |
| 6.1 | 6 | todo | Loan balance statement parser | Step 5.1 | `ParseResult` returned; fuzzy column match works; dry-run mode works |
| 6.2 | 6 | todo | Transaction statement parser | Step 6.1 | `TxnType` normalised; cross-ref account validation works |
| 7.1 | 7 | todo | Resumable upload processing pipeline | Steps 5.1, 6.1, 6.2 | Idempotent pipeline; partial success flag; error logged per row |
| 7.2 | 7 | todo | KPI computation engine — Gold Loan | Step 7.1 | All 15 metrics computed for FTD/MTD/YTD; upserted to `kpi_snapshots` |
| 7.3 | 7 | todo | Data access layer — server actions & client hooks | Steps 4.1, 7.2 | 6 server actions + `useGoldLoanDashboard` hook; `API_SURFACE.md` created |
| 8.1 | 8 | todo | Gold Loan dashboard page shell | Steps 4.2, 7.3 | CSS Grid layout; skeleton loaders; FTD/MTD/YTD period in URL param |
| 8.2 | 8 | todo | Section: Executive Summary KPI Grid | Step 8.1 | Live data; loading/empty/error states all handled |
| 8.3 | 8 | todo | Section: Disbursement & Collection | Step 8.1 | Live Recharts chart; period toggle works |
| 8.4 | 8 | todo | Section: Bucket-wise Overdue Analysis | Step 8.1 | Live bucket bar chart |
| 8.5 | 8 | todo | Section: New Customers | Step 8.1 | Live count with branch breakdown |
| 8.6 | 8 | todo | Section: Closed Gold Loan / Grams Released | Step 8.1 | Live closure count + grams total |
| 8.7 | 8 | todo | Section: High Risk Accounts | Step 8.1 | Sorted by LTV desc; max 100 rows; LTV > 75% flagged |
| 8.8 | 8 | todo | Section: NPA & Risk Monitoring | Step 8.1 | GNPA amount + percent live |
| 8.9 | 8 | todo | Section: Branch Performance Table | Step 8.1 | Live table; client-side sortable |
| 8.10 | 8 | todo | Section: Alerts & Exceptions | Step 8.1 | Severity badge rendering; Pusher real-time updates |
| 9.1 | 9 | todo | Employee upload page UI | Step 5.1 | Drag-drop zone; status polling every 5s |
| 9.2 | 9 | todo | Super Admin — company & user management | Step 4.1 | `/admin/companies` and `/admin/users` fully functional |
| 9.3 | 9 | todo | Security hardening pass | All above | `SECURITY_CHECKLIST.md` all rows pass |
| 9.4 | 9 | todo | Tests & manual QA guide | All above | `MANUAL_QA.md` written; unit tests for auth/upload/parsers/KPI pass |
| 9.5 | 9 | todo | Deployment preparation | All above | `DEPLOYMENT_NOTES.md`; `.env.local.example` complete; Vercel build green |

---

## Context Reload Blocks

> **How to use:** At the start of a new AI session, paste the block for the current `in-progress` step below into the chat along with this file. The AI can then resume without re-reading the entire repo.

---

### Step 0.1 — Repo Audit

This step produced a pure analysis of the existing `Dhanushmcmsd/Dashboard` repo against the Supra Pacific technical plan. No code was generated. The output is `REPO_AUDIT.md` with 8 sections: current stack (Next.js 16 App Router, NextAuth v4, Prisma/PostgreSQL, Pusher, Resend, TanStack Query), dependency map, reuse/replace/remove decisions per module, gaps vs tech plan, target folder structure, 12-step phased migration plan, risk list, and recommended branch name (`feat/migration-v2-rebuild`). Status: **done**.

---

### Step 1.1 — Planning Docs

This step creates five living markdown planning documents that survive context resets: `REBUILD_ROADMAP.md` (this file — step tracker with context reload blocks), `MODULE_BREAKDOWN.md` (per-module purpose + key files + deps), `MIGRATION_NOTES.md` (assumptions, confirmed deviations, open questions), `DATA_CONTRACTS.md` (canonical TypeScript interfaces for all cross-layer data shapes), and `CHANGELOG.md` (Keep-a-Changelog format). No features are built. These docs are the source of truth for all future sessions. Status: **done**.

---

### Step 2.1 — UI Audit

This step enumerates every component in `components/` and every page in `app/`, producing `DASHBOARD_UI_AUDIT.md`. For each component: current purpose, reuse/replace/remove decision, and target location in the new architecture. Also extracts existing design tokens (colors, spacing, typography) from `tailwind.config.ts` and `app/globals.css`. No code changes — audit only. Dependencies: Step 1.1 docs must be in place for naming conventions.

---

### Step 3.1 — Prisma Schema

This step extends `prisma/schema.prisma` to add 6 new models alongside existing ones: `Company` (multi-tenant root), `Portfolio` (product line per company), `DataUpload` (file upload record with state machine), `GoldLoanAccount` (parsed loan record), `GoldLoanTxn` (parsed transaction record), `KpiSnapshot` (computed metrics). Every tenant-scoped model gets `company_id`. Soft deletes on accounts and uploads. Composite unique indexes for upsert safety. Output: updated `schema.prisma` + new migration file + `SCHEMA_DECISIONS.md`.

---

### Step 3.2 — Seed Data

This step creates an idempotent seed script (`prisma/seed.ts`) that populates: 1 Company (`supra-pacific`), 1 Portfolio (gold_loan, phase=1), and 3 Users (super_admin, company_admin, employee) with bcrypt-hashed passwords. Running the seed twice must not create duplicates (upsert pattern). Uses `dotenv-cli` to load `.env.local`. Output: updated `prisma/seed.ts`.

---

### Step 4.1 — Auth with Company Scoping

This step extends the existing NextAuth v4 config (`lib/auth.ts`) so the JWT and session expose: `userId`, `email`, `role`, `companyId`, `companySlug`. Creates `lib/auth/withCompanyScope.ts` — a server-side helper that every server action and API route handler must call to get typed, company-scoped session data. Updates `middleware.ts` to protect `/:companySlug/*` routes and redirect by role. Updates `next-auth.d.ts` type augmentation. Output: ≤6 files changed.

---

### Step 4.2 — Route Shells & Navigation

This step creates placeholder page components for all role-based routes so navigation is testable before real data arrives: `/[companySlug]/gold-loan`, `/[companySlug]/upload`, `/admin/users`, `/admin/companies`. Each page shows a role banner (role + companySlug from session). Sidebar/navbar component adapts links based on role. Output: new page files + updated nav component.

---

### Step 4.3 — Domain Layer

This step creates `lib/domain/index.ts` exporting all enums and interfaces from `DATA_CONTRACTS.md`. Also adds utility functions: `getDateRange(period: PeriodType, asOnDate: Date)` and `formatCurrency(amount: number, locale?: string)`. These become the single import for all domain types across the app. No database changes. Output: `lib/domain/index.ts`, `lib/domain/utils.ts`, updated `tsconfig.json` path alias if needed.

---

### Step 5.1 — Upload Backend

This step implements the upload API route (`app/api/upload/route.ts`) with: MIME + magic-byte validation (Excel only), file stored as `rawData` JSON in `DataUpload` record, status machine transitions (pending → processing → success/failed/partial_success). Returns upload ID for polling. Reuses existing `lib/excel-parser.ts`. Adds `lib/upload/validate.ts` for magic-byte check. Output: updated upload route + new validate helper + updated Prisma queries.

---

### Step 6.1 — Loan Balance Parser

This step implements `lib/parsers/loanBalanceParser.ts` which takes a parsed Excel workbook (from `lib/excel-parser.ts`) and returns `ParseResult<GoldLoanAccount[]>`. Features: fuzzy column header matching (handles slight naming variations), required vs optional field enforcement, per-row error collection, dry-run mode (parse without saving). Output: `lib/parsers/loanBalanceParser.ts` + `lib/parsers/types.ts`.

---

### Step 6.2 — Transaction Parser

This step implements `lib/parsers/transactionParser.ts` returning `ParseResult<GoldLoanTxn[]>`. Normalises `TxnType` from raw string values. Validates that every `account_number` in the transaction file exists in the corresponding loan balance upload (cross-reference check). Handles partial matches gracefully. Output: `lib/parsers/transactionParser.ts` + updated `lib/parsers/types.ts`.

---

### Step 7.1 — Processing Pipeline

This step creates `lib/pipeline/processUpload.ts` — an idempotent async function called by the cron job (not inline in the upload route). It orchestrates: parse → validate → upsert GoldLoanAccount/GoldLoanTxn rows → update DataUpload status. Idempotent: re-running the same upload_id soft-deletes old rows first. Partial success: if ≥1 row fails, status = `partial_success`; errors stored per-row in upload metadata. Output: `lib/pipeline/processUpload.ts` + updated cron route.

---

### Step 7.2 — KPI Computation Engine

This step implements `lib/kpi/computeAllKpis.ts` which computes all 15 Gold Loan KPI metrics for FTD, MTD, and YTD periods given `(companyId, asOnDate)`. Financial year starts April 1. Bucket intervals are half-open `[0,30)`. Metrics include: total outstanding, disbursements, collections, new customers, closures, NPA amount/%, LTV distribution, grams released, overdue buckets, branch performance. Results upserted into `kpi_snapshots`. All formula assumptions documented in inline comments. Output: `lib/kpi/computeAllKpis.ts` + `KPI_ENGINE_NOTES.md`.

---

### Step 7.3 — Data Access Layer

This step creates 6 server actions in `lib/actions/` (one per major dashboard data shape) and a `useGoldLoanDashboard` React hook in `hooks/useGoldLoanDashboard.ts` that composes them via TanStack Query. Server actions enforce `withCompanyScope()` on every call. Also creates `API_SURFACE.md` documenting every server action's input/output/auth requirements. Output: `lib/actions/*.ts` + `hooks/useGoldLoanDashboard.ts` + `API_SURFACE.md`.

---

### Steps 8.1–8.10 — Dashboard Sections

These steps build the Gold Loan dashboard page section by section. Step 8.1 creates the page shell with CSS Grid layout, skeleton loaders, and `?period=FTD|MTD|YTD` URL param. Steps 8.2–8.10 each add one section using live data from the server actions created in Step 7.3. Every section handles loading, empty, and error states independently. All chart components use Recharts.

---

### Step 9.1 — Employee Upload UI

This step builds the upload page UI at `/[companySlug]/upload`. Features: drag-and-drop file zone, client-side MIME validation before upload, progress indicator, and status polling every 5s using TanStack Query `refetchInterval`. Displays parsed/failed row counts from the upload record. Output: `app/[companySlug]/upload/page.tsx` + `components/upload/` components.

---

### Step 9.2 — Super Admin Pages

This step builds `/admin/companies` (list + create/deactivate companies) and `/admin/users` (list + invite + deactivate users). Both pages are gated to `SUPER_ADMIN` role only. Uses existing `app/api/users` and adds `app/api/companies`. Output: new page files + API routes + updated nav for super_admin role.

---

### Step 9.3 — Security Hardening

This step performs a security audit pass: verify `organizationId` isolation in all Prisma queries, add missing Zod validation on all API routes, set security headers in `next.config.mjs`, confirm rate limiting on auth routes, review `vercel.json` function timeouts, rotate `NEXTAUTH_SECRET` docs. Output: `SECURITY_CHECKLIST.md` with all items passing; ≤8 file changes.

---

### Step 9.4 — Tests & QA Guide

This step adds Vitest unit tests for the four highest-risk modules: auth helper (`withCompanyScope`), upload validation, loan balance parser, and KPI computation engine. Also creates `MANUAL_QA.md` with a step-by-step QA script covering: login by role, upload flow, dashboard data display, export. Output: `vitest.config.ts` + `tests/` folder + `MANUAL_QA.md`.

---

### Step 9.5 — Deployment Preparation

This step finalises deployment configuration: updates `.env.local.example` with all new variables added during the rebuild, verifies `vercel.json` cron schedule and function memory, writes `DEPLOYMENT_NOTES.md` (env checklist, DB migration steps, first-run seed instructions, rollback procedure). Confirms `prisma generate` runs on Vercel post-install. Output: updated config files + `DEPLOYMENT_NOTES.md`.
