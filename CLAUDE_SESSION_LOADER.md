# 🔁 CLAUDE SESSION LOADER — Supra Pacific Dashboard Rebuild

> **Read this file at the START of every Claude session before writing any code.**

---

## What This Project Is

A full rebuild of the **Supra Pacific Dashboard** — a multi-tenant financial analytics platform for managing gold loan and other loan portfolios across multiple companies.

- **Repo:** `Dhanushmcmsd/Dashboard`
- **Framework:** Next.js (App Router), TypeScript, Tailwind CSS
- **Auth:** NextAuth (existing, being extended)
- **Database:** PostgreSQL via Prisma
- **Deployment:** Vercel
- **Prompt Pack:** `_BATCH_0_START_HERE.md` → then follow `REBUILD_ROADMAP.md`

---

## Current Repo State (as of May 2026)

| Area | What Exists |
|---|---|
| Framework | Next.js App Router, TypeScript, Tailwind |
| Auth | NextAuth (basic — needs company/role extension) |
| Database | Prisma schema (basic user model — needs full extension) |
| UI | Existing dashboard components in `/components`, `/app` |
| Planning Docs | `tech-plan-and-ai-prompt.md`, `AUTH_SECURITY.md` |
| Prompt Pack | `SupraPacific_Claude_Prompt_Pack.docx` (batch-by-batch guide) |

---

## Upgrade Philosophy (Non-Negotiable Rules)

| Principle | Meaning |
|---|---|
| **Idempotency** | Re-running never breaks data — upserts, not inserts |
| **Tenant Isolation** | `company_id` enforced at every DB layer |
| **Typed Contracts** | No `any` — all cross-layer boundaries use domain interfaces |
| **Failure Recovery** | Partial success handled explicitly |
| **Schema Transparency** | Missing fields → labelled TODO placeholders, not blank screens |
| **Documentation Depth** | Every created file has rationale comments |

---

## Batch Execution Order

| Batch | Name | Status |
|---|---|---|
| 0 | Repo Audit & Migration Blueprint | 🔜 TODO |
| 1 | Planning Documentation (5 docs) | 🔜 TODO |
| 2 | UI Audit | 🔜 TODO |
| 3 | Database Schema + Seed | 🔜 TODO |
| 4 | Auth & Routing (3 prompts) | 🔜 TODO |
| 5 | Upload Foundation | 🔜 TODO |
| 6 | Spreadsheet Parsers (2 prompts) | 🔜 TODO |
| 7 | Processing Pipeline & KPI Engine (3 prompts) | 🔜 TODO |
| 8 | Dashboard Shell & Sections (10 prompts) | 🔜 TODO |
| 9 | Admin, Upload UI & Security (5 prompts) | 🔜 TODO |

> ⚠️ **Do ONE batch prompt per Claude session. Commit before moving to the next.**

---

## How to Use This Loader

1. Open a **new Claude session**
2. Attach this file + `tech-plan-and-ai-prompt.md` to the session
3. Say: *"Read CLAUDE_SESSION_LOADER.md and then check REBUILD_ROADMAP.md for the next TODO step"*
4. Paste the corresponding batch prompt from the Prompt Pack
5. After Claude finishes, commit and push
6. Update the STATUS in `REBUILD_ROADMAP.md` to ✅ done

---

## Key Files Reference

```
/
├── CLAUDE_SESSION_LOADER.md        ← You are here
├── _BATCH_0_START_HERE.md          ← First prompt to run
├── REBUILD_ROADMAP.md              ← Created in Batch 1 (session tracker)
├── DATA_CONTRACTS.md               ← Created in Batch 1 (canonical TS types)
├── tech-plan-and-ai-prompt.md      ← Original technical plan (always attach)
├── prisma/schema.prisma            ← Extended in Batch 3
├── app/                            ← Next.js App Router pages
├── components/                     ← Existing UI components
├── lib/                            ← Utilities (domain layer added in Batch 4)
└── middleware.ts                   ← Auth middleware (extended in Batch 4)
```

---

## Target Architecture (Post-Rebuild)

```
/
├── app/
│   ├── (auth)/login/
│   ├── [companySlug]/
│   │   ├── gold-loan/
│   │   ├── pledge-loan/   (placeholder)
│   │   ├── ml-loan/       (placeholder)
│   │   ├── personal-loan/ (placeholder)
│   │   └── vehicle-loan/  (placeholder)
│   ├── upload/
│   └── admin/
│       ├── users/
│       └── companies/
├── lib/
│   ├── domain/            ← Types, interfaces, enums
│   ├── auth/              ← withCompanyScope() helper
│   ├── db/                ← Prisma client
│   ├── parsers/           ← Loan balance & transaction parsers
│   ├── pipeline/          ← Upload processing pipeline
│   └── kpi/               ← KPI computation engine
├── components/
│   ├── dashboard/         ← Section components
│   ├── ui/                ← Shared UI primitives
│   └── upload/            ← Upload UI components
└── prisma/
    ├── schema.prisma
    └── seed.ts
```
