# REBUILD ROADMAP — Supra Pacific Dashboard

> **STATUS KEY:** `todo` | `in-progress` | `done`  
> Update this file after every session. Claude reads this to self-orient.

---

| Step | Batch | Status | Goal | Dependencies | Acceptance Criteria |
|---|---|---|---|---|---|
| 0.1 | 0 | todo | Repo audit & migration blueprint | None | 8-section analysis doc produced, no code generated |
| 1.1 | 1 | todo | Create 5 planning docs | Step 0.1 | REBUILD_ROADMAP, MODULE_BREAKDOWN, MIGRATION_NOTES, DATA_CONTRACTS, CHANGELOG created |
| 2.1 | 2 | todo | UI component inventory & design token extraction | Step 1.1 | DASHBOARD_UI_AUDIT.md created |
| 3.1 | 3 | todo | Prisma schema design — new models | Step 1.1 | schema.prisma updated with all 7 models, SCHEMA_DECISIONS.md created |
| 3.2 | 3 | todo | Seed data — companies, portfolios, users | Step 3.1 | Idempotent seed runs twice without error |
| 4.1 | 4 | todo | Role-based auth with company scoping | Step 3.1 | withCompanyScope() helper, session fields: userId/email/role/companyId/companySlug |
| 4.2 | 4 | todo | Route shells & navigation scaffolding | Step 4.1 | All routes return 200 with role banner, nav adapts to role |
| 4.3 | 4 | todo | Domain layer — types, interfaces, utilities | Step 1.1 | All enums/interfaces exported from lib/index.ts, getDateRange/formatCurrency working |
| 5.1 | 5 | todo | Upload backend — validation, storage, state machine | Step 3.1 | File validated by MIME+magic bytes, status transitions enforced |
| 6.1 | 6 | todo | Loan balance statement parser | Step 5.1 | ParseResult returned, fuzzy column match works, dry-run mode works |
| 6.2 | 6 | todo | Transaction statement parser | Step 6.1 | TxnType normalised, cross-ref account validation works |
| 7.1 | 7 | todo | Resumable upload processing pipeline | Steps 5.1, 6.1, 6.2 | Idempotent pipeline, partial success flag, error logged per row |
| 7.2 | 7 | todo | KPI computation engine — Gold Loan | Step 7.1 | All 15 metrics computed for FTD/MTD/YTD, upserted to kpi_snapshots |
| 7.3 | 7 | todo | Data access layer — server actions & client hooks | Steps 4.1, 7.2 | 6 server actions + useGoldLoanDashboard hook, API_SURFACE.md created |
| 8.1 | 8 | todo | Gold Loan dashboard page shell | Steps 4.2, 7.3 | CSS Grid layout, skeleton loaders, FTD/MTD/YTD in URL param |
| 8.2 | 8 | todo | Section: Executive Summary KPI Grid | Step 8.1 | Live data, loading/empty/error states |
| 8.3 | 8 | todo | Section: Disbursement & Collection | Step 8.1 | Live chart, period toggle |
| 8.4 | 8 | todo | Section: Bucket-wise Overdue Analysis | Step 8.1 | Live bucket chart |
| 8.5 | 8 | todo | Section: New Customers | Step 8.1 | Live data |
| 8.6 | 8 | todo | Section: Closed Gold Loan / Grams Released | Step 8.1 | Live data |
| 8.7 | 8 | todo | Section: High Risk Accounts | Step 8.1 | Sorted by LTV desc, max 100 rows |
| 8.8 | 8 | todo | Section: NPA & Risk Monitoring | Step 8.1 | GNPA amount/percent live |
| 8.9 | 8 | todo | Section: Branch Performance Table | Step 8.1 | Live table, sortable |
| 8.10 | 8 | todo | Section: Alerts & Exceptions | Step 8.1 | Severity badges |
| 9.1 | 9 | todo | Employee upload page UI | Step 5.1 | Drag-drop, status polling every 5s |
| 9.2 | 9 | todo | Super Admin — company & user management | Step 4.1 | /admin/companies and /admin/users functional |
| 9.3 | 9 | todo | Security hardening pass | All above | SECURITY_CHECKLIST.md all rows pass |
| 9.4 | 9 | todo | Tests & manual QA guide | All above | MANUAL_QA.md, unit tests for auth/upload/parsers/KPI |
| 9.5 | 9 | todo | Deployment preparation | All above | DEPLOYMENT_NOTES.md, .env.example complete, Vercel-compatible |

---

## Context Reload Blocks

### Step 0.1 — Repo Audit
This step produces a pure analysis of the existing repo against the Supra Pacific technical plan. No code is written. Output is a migration strategy with 8 sections: stack, dependency map, reuse/replace decisions, gaps, target structure, phased plan, risk list, and branch name. Start by reading `tech-plan-and-ai-prompt.md`.

### Step 1.1 — Planning Docs
This step creates five markdown planning documents: REBUILD_ROADMAP, MODULE_BREAKDOWN, MIGRATION_NOTES, DATA_CONTRACTS (canonical TypeScript interfaces), and CHANGELOG. These docs survive context resets and are loaded at the start of future sessions. No features are built.

### Step 3.1 — Prisma Schema
This step extends the existing Prisma schema to add 7 new models: companies, portfolios, users (extend existing), data_uploads, gold_loan_accounts, gold_loan_txns, kpi_snapshots. Every tenant-scoped model gets `company_id`. Soft deletes on accounts and uploads. Composite unique indexes for upsert safety.

### Step 4.1 — Auth
This step extends NextAuth so the JWT/session exposes `userId, email, role, companyId, companySlug`. Creates a `withCompanyScope()` server-side helper used in every future server action. Middleware protects `/:companySlug/*` routes and redirects by role.

### Step 7.2 — KPI Engine
This step implements `computeAllKpis(companyId, asOnDate)` which computes 15 Gold Loan metrics for FTD, MTD, and YTD periods, then upserts them into `kpi_snapshots`. Financial year starts April 1. Bucket intervals are half-open `[0,30)`. All formula assumptions documented in `KPI_ENGINE_NOTES.md`.
