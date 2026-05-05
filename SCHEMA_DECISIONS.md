# SCHEMA DECISIONS
> Batch 3 · Database design rationale and migration safety notes.
> Update this file whenever the schema changes — one section per model.

---

## Pre-existing Models (unchanged)

The following models existed before Batch 3 and were **not structurally altered**:

| Model | Notes |
|---|---|
| `Organization` | Legacy multi-tenant root. Kept intact; `Company` added separately to avoid breaking `User.organizationId` FK. |
| `User` | Extended with nullable `companyId` FK → `Company`. Existing rows get `NULL` companyId — safe. |
| `PasswordResetToken` | Unchanged. |
| `Upload` | Unchanged. Deprecated in favour of `DataUpload`; retained until Step 5.1 migration is complete. |
| `DailySnapshot` | Unchanged. |
| `MonthlySnapshot` | Unchanged. |
| `Alert` | Extended with nullable `severity` field defaulting to `INFO` — existing rows remain valid. |
| `AuditLog` | Unchanged. |
| `DashboardLayout` | Unchanged. |
| `playing_with_neon` | Unchanged (Neon test artefact). |

---

## Model: `Company`

### Purpose
Canonical tenant record for the new multi-company architecture. Each `Company` owns portfolios, uploads, and KPI snapshots. Distinct from the legacy `Organization` model to avoid a breaking migration on `User.organizationId`.

### Key Design Decisions
- `slug` is `@unique` and URL-safe — used in path params (`/company/:slug/dashboard`).
- `isActive` flag allows disabling a company without deleting historical data.
- No hard delete — companies are deactivated, never removed.

### Migration Safety
**Impact on existing data:** None. This is a new table with no FK requirements on insert. Existing `User` rows are unaffected because `User.companyId` is nullable. Run `prisma migrate deploy` — zero downtime, zero data loss.

### Open Questions
- Should `Company` replace `Organization` fully, or run in parallel permanently?
- Who is allowed to create a `Company` record? Only `SUPER_ADMIN`?

---

## Model: `Portfolio`

### Purpose
Represents one product line (e.g. Gold Loan) within a company. Controls which parser, KPI keys, and UI sections are active. One `Portfolio` row per `(company, type)` pair — enforced by `@@unique([companyId, type])`.

### Key Design Decisions
- `phase` enum (`ONBOARDING → ACTIVE → ARCHIVED`) drives feature gating without schema changes.
- `@@unique([companyId, type])` means only one Gold Loan portfolio per company — prevents accidental duplicates.
- `portfolioId` is required on every downstream model (`DataUpload`, `GoldLoanAccount`, `KpiSnapshot`) for clean per-product queries.

### Migration Safety
**Impact on existing data:** None. New table. Existing `Upload` rows do not reference `Portfolio` — legacy upload flow is unchanged. New DataUpload flow requires a Portfolio row to exist first; seed must create these before parser runs.

### Open Questions
- Can a company have multiple archived portfolios of the same type (e.g. two closed Gold Loan portfolios)? Current unique constraint prevents this — relax to `(companyId, type, isActive)` if needed.

---

## Model: `DataUpload`

### Purpose
Replaces `Upload` for structured data ingestion. Tracks the full lifecycle of a file from receipt to parsed rows committed in `GoldLoanAccount`. Soft delete preserves the audit trail.

### Key Design Decisions
- `@@unique([companyId, portfolioId, asOnDate])` prevents two uploads for the same business date. The parser can safely upsert by this key instead of checking for duplicates manually.
- `deletedAt` soft delete: UI shows "deleted" state, row stays for audit. Hard deletes are blocked at the app layer.
- `status` state machine: `PENDING → PROCESSING → SUCCESS | FAILED`. Parser sets status; never set directly from client API.
- `errorMessage` is only written when `status = FAILED`; null otherwise.
- `rowCount` is populated after SUCCESS so dashboards can show "1,247 accounts loaded".

### Migration Safety
**Impact on existing data:** None. New table. Legacy `Upload` records are untouched. The two models coexist — `Upload` handles old HTML/Excel uploads; `DataUpload` handles new structured gold-loan uploads.

### Open Questions
- Should `asOnDate` be date-only (`@db.Date`) or full timestamp? Current: full timestamp. Recommend constraining to date-only in app layer (`startOf('day')`) before insert.
- Maximum retry count for FAILED uploads — should it be in this table or a separate retry queue?

---

## Model: `GoldLoanAccount`

### Purpose
One row per gold loan account per upload snapshot. Represents the state of an account **as of the upload date** — not a live ledger. Transactions are in `GoldLoanTxn`.

### Key Design Decisions
- `@@unique([companyId, accountNumber, uploadId])` — the same account number appearing in two different uploads (two different dates) creates two rows. This is intentional: it preserves point-in-time history.
- `deletedAt` soft delete: if a branch corrects a file and re-uploads, old account rows are soft-deleted and new rows inserted under the new `uploadId`.
- `ltvPercent` stored as a plain float (not computed at query time) — recomputing on every query is too expensive given 15,000+ accounts.
- `bucket` enum maps directly to DPD ageing buckets (`CURRENT`, `DPD_0_30`, etc.) — used for bucket chart queries without string parsing.
- `isNpa` boolean is denormalised from `bucket` for fast index-based NPA count queries.
- `status` is a plain `String` (not enum) to allow values beyond `ACTIVE/CLOSED/NPA` without a schema migration.

### Migration Safety
**Impact on existing data:** None. New table. No existing model references it.

### Open Questions
- Should `branch` be a FK to a `Branch` table or remain a free string? Current: free string (matches legacy `Upload.branch`). A `Branch` model would enable stricter validation but requires a migration + seed step.
- `goldWeightGrams` precision: `Float` loses precision beyond 6 significant digits. For very large accounts (1,000+ grams), consider `@db.DoublePrecision` or `Decimal`.

---

## Model: `GoldLoanTxn`

### Purpose
Append-only event ledger for a gold loan account. Each disbursement, collection, closure, or part-payment creates one row. Never soft-deleted — incorrect entries are reversed with a new offsetting row.

### Key Design Decisions
- **Append-only**: no `updatedAt`, no `deletedAt`. Immutability ensures the running balance (`balanceAfter`) is always auditable.
- `amount` sign convention: positive = money received (collection, closure), negative = money sent out (disbursement).
- `balanceAfter` is denormalised (stored, not computed) so historical balance queries are O(1) per row.
- No `companyId` on this model — tenant isolation is inherited via `accountId → GoldLoanAccount.companyId`. Querying `GoldLoanTxn` always goes through `GoldLoanAccount`.

### Migration Safety
**Impact on existing data:** None. New table.

### Open Questions
- Should `balanceAfter` be computed by the app or by a DB trigger? Current plan: app layer computes and writes it. If concurrent writes become a problem, a DB trigger is safer.
- Is `INTEREST_ACCRUAL` a real transaction type for this business, or is interest tracked differently?

---

## Model: `KpiSnapshot`

### Purpose
Pre-computed aggregation results. One row per `(company, portfolio, periodType, asOnDate, metricKey)`. EAV (Entity-Attribute-Value) pattern chosen over wide columns so adding new KPI metrics never requires `ALTER TABLE`.

### Key Design Decisions
- EAV trade-off: slightly harder to query multiple metrics at once (requires `PIVOT` or multiple joins) but zero-cost schema evolution. Acceptable because KPI queries are always "give me all metrics for this snapshot" not "filter by metric value".
- `@@unique([companyId, portfolioId, periodType, asOnDate, metricKey])` — safe to upsert (recompute) on every upload without duplicates.
- `computedAt` enables staleness detection: if `computedAt` is more than N minutes before now, dashboard shows a "data may be stale" banner.
- No soft delete — stale snapshots are overwritten via upsert, not soft-deleted. Old date snapshots are kept indefinitely for trend queries.

### Migration Safety
**Impact on existing data:** None. New table.

### Open Questions
- Should `metricValue` support non-numeric values (e.g. a list of missing branch names)? Current: `Float` only. Workaround: encode lists in a separate `metadata Json?` column (add in Step 4.x).
- Retention policy: how long should old `KpiSnapshot` rows be kept? No policy defined yet.

---

## Enum: `AlertSeverity`

### Purpose
Adds `INFO / WARNING / CRITICAL` severity to `Alert`. Existing rows default to `INFO` — backward-compatible.

### Migration Safety
**Impact on existing data:** Safe. New column with `@default(INFO)` — all existing `Alert` rows will have `severity = INFO` after migration. No data loss.

---

## Enum additions summary

| Enum | Values | New in Batch 3? |
|---|---|---|
| `Role` | SUPER_ADMIN, ADMIN, MANAGEMENT, EMPLOYEE | No (existing) |
| `FileType` | EXCEL, HTML, **CSV** | CSV added |
| `PortfolioType` | GOLD_LOAN, ML_LOAN, VEHICLE_LOAN, PERSONAL_LOAN, SUPERMARKET | **New** |
| `PortfolioPhase` | ONBOARDING, ACTIVE, ARCHIVED | **New** |
| `UploadStatus` | PENDING, PROCESSING, SUCCESS, FAILED | **New** |
| `LoanBucket` | CURRENT, DPD_0_30, DPD_31_60, DPD_61_90, DPD_90_PLUS | **New** |
| `TxnType` | DISBURSEMENT, COLLECTION, CLOSURE, PART_PAYMENT, INTEREST_ACCRUAL | **New** |
| `PeriodType` | FTD, MTD, YTD, CUSTOM | **New** |
| `AlertSeverity` | INFO, WARNING, CRITICAL | **New** |

---

## Migration Run Order

When running `prisma migrate dev` for the first time after Batch 3:

1. New enums created (no table impact)
2. `Company` table created (empty)
3. `Portfolio` table created (empty)
4. `DataUpload` table created (empty)
5. `GoldLoanAccount` table created (empty)
6. `GoldLoanTxn` table created (empty)
7. `KpiSnapshot` table created (empty)
8. `User.companyId` column added as `NULL` (existing rows unaffected)
9. `Alert.severity` column added with default `INFO` (existing rows unaffected)
10. `FileType` enum extended with `CSV` value

**Estimated downtime:** Zero. All new tables, all nullable/defaulted additions.

**Rollback plan:** `prisma migrate revert` drops the new tables. `User.companyId` and `Alert.severity` columns must be manually dropped if auto-revert is not used (Postgres does not support `ALTER TABLE DROP COLUMN` in a single transaction with enum drops in older versions).

---

## What Is NOT in This Schema (deferred to later steps)

| Feature | Deferred To |
|---|---|
| `Branch` model (FK-validated branch names) | Step 4.x |
| `EmailNotification` model | Step 6.3 |
| `RateLimit` table (if DB-backed) | Step 5.3 |
| `DashboardLayout.companyId` (tenant-scope dashboards) | Step 7.1 |
| `KpiSnapshot.metadata Json?` (non-numeric metrics) | Step 4.x |
| Full-text search indexes | Step 9.x |
