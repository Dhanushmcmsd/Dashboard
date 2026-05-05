# DASHBOARD UI AUDIT
> Batch 2 · Analysis-only. No visual code modified.
> Generated: 2026-05-05 | Repo: `Dhanushmcmsd/Dashboard`

---

## 1. CURRENT COMPONENT INVENTORY

> ⚠️ = **Reuse Risk** — component has hardcoded data, env-specific assumptions, or hidden coupling that may break on domain change.

### `components/management/`

| Component | File | Props Summary | Used On | Reuse Risk |
|---|---|---|---|---|
| `KPICard` | `KPICard.tsx` | `label`, `value` (number), `icon?`, `colorClass?`, `subtext?`, `onClick?`, `trend?`, `trendValue?` | `BranchDetailView`, `BranchComparisonChart` | ⚠️ Calls `formatINRCompact` / `formatINRFull` from `lib/utils` — assumes all values are INR currency numbers; non-currency metrics will render incorrectly |
| `BranchDetailView` | `BranchDetailView.tsx` | `branch: BranchName` | `app/management/gold-loan/page.tsx`, all other branch pages | ⚠️ Hardcoded to 4 KPI metrics (closingBalance, disbursement, collection, npa) from `useBranchDashboard` — does not match full Gold Loan KPI set; no FTD/MTD/YTD period control |
| `BranchComparisonChart` | `BranchComparisonChart.tsx` | Props not fully enumerated (7.9 KB) — likely `data: BranchData[]`, `metric: string` | `app/management/daily/`, `app/management/monthly/` | ⚠️ References `BranchName` type from `@/types` — if branches change, type must update |
| `BranchUploadStatus` | `BranchUploadStatus.tsx` | Likely `branch: BranchName`, `date: string` | Management daily/monthly pages | ⚠️ Depends on `DailySnapshot.missingBranches` — field uses string array, not FK to Branch model |
| `CollectionEfficiencyChart` | `CollectionEfficiencyChart.tsx` | Likely `data: CollectionData[]` | Management daily page | Low risk — Recharts wrapper |
| `DisbursementTrendChart` | `DisbursementTrendChart.tsx` | Likely `data: TrendPoint[]` | Management daily/monthly | Low risk — Recharts wrapper |
| `DpdBucketChart` | `DpdBucketChart.tsx` | `data: { bucket, count, amount }[]` | `BranchDetailView` | ⚠️ Uses local bucket key format (`dpd0`, `dpd30`, etc.) — must align with `LoanBucket` enum in DATA_CONTRACTS |
| `GnpaGauge` | `GnpaGauge.tsx` | Likely `npaPercent: number` | Management gold-loan or daily | ⚠️ Threshold for red (5%) is hardcoded in component — not configurable |
| `KPICard` (alias in WidgetRenderer) | `WidgetRenderer.tsx` | Via `config.metric` | Dashboard builder | ⚠️ Falls back to `closingBalance` when metric is undefined — silent wrong data if config is incomplete |
| `LiveUploadFeed` | `LiveUploadFeed.tsx` | Likely no props — auto-subscribes to Pusher | Management layout or daily | ⚠️ Couples to Pusher channel name hardcoded in component |
| `MetricDrawer` | `MetricDrawer.tsx` | Likely `metric: string`, `data: unknown` | Management daily/monthly | Low risk — display-only |
| `PortfolioMixChart` | `PortfolioMixChart.tsx` | Likely `data: { type, amount }[]` | Management dashboards | ⚠️ References portfolio types — assumes all 5 portfolios are active; placeholder types will show zero values |

### `components/dashboard-builder/`

| Component | File | Props Summary | Used On | Reuse Risk |
|---|---|---|---|---|
| `WidgetCanvas` | `WidgetCanvas.tsx` | `state: DashboardState`, `onLayoutChange`, `onConfigure`, `onDelete` | `app/management/dashboards/` | ⚠️ Tightly coupled to `react-grid-layout` — SSR-incompatible without `dynamic` import wrapper |
| `WidgetRenderer` | `WidgetRenderer.tsx` | `config: WidgetConfig`, `isShared: boolean`, `onConfigure`, `onDelete` | `WidgetCanvas` | ⚠️ Uses `data as any` cast inside `WidgetBody` — runtime shape mismatch will silently render wrong values |
| `WidgetConfigPanel` | `WidgetConfigPanel.tsx` | Likely `config: WidgetConfig`, `onSave`, `onClose` | Dashboard builder modal | ⚠️ `DATA_SOURCES` enum only supports `daily_snapshot` / `monthly_snapshot` — does not include KpiSnapshot source |
| `WidgetSidebar` | `WidgetSidebar.tsx` | Likely `onAdd: (type: WidgetType) => void` | Dashboard builder | Low risk |
| `ExportButton` | `ExportButton.tsx` | Likely `dashboardId: string` | Dashboard builder | ⚠️ Uses `html2canvas` + `jspdf` — may fail on dynamic chart canvases that render SVG |

### `components/admin/`

| Component | File | Props Summary | Used On | Reuse Risk |
|---|---|---|---|---|
| `AdminNav` | `AdminNav.tsx` | No props — reads session internally | `app/admin/layout.tsx` | ⚠️ Hardcoded nav items — does not dynamically show/hide based on `SUPER_ADMIN` vs `ADMIN` role |

### `components/employee/`

| Component | File | Props Summary | Used On | Reuse Risk |
|---|---|---|---|---|
| `SignOutButton` | `SignOutButton.tsx` | None | `app/employee/` | Low risk |

### `components/providers/`

| Component | File | Props Summary | Used On | Reuse Risk |
|---|---|---|---|---|
| `AuthProvider` | `AuthProvider.tsx` | `children` | `app/layout.tsx` | Low risk — thin `SessionProvider` wrapper |
| `QueryProvider` | `QueryProvider.tsx` | `children` | `app/layout.tsx` | Low risk — TanStack Query `QueryClientProvider` wrapper |
| `EventsProvider` | `EventsProvider.tsx` | `children` | `app/management/layout.tsx` | ⚠️ Initialises Pusher client — requires `NEXT_PUBLIC_PUSHER_KEY` + `NEXT_PUBLIC_PUSHER_CLUSTER` at build time |

### `components/shared/`

| Component | File | Props Summary | Used On | Reuse Risk |
|---|---|---|---|---|
| `MissingBranchBanner` | `MissingBranchBanner.tsx` | Likely `branches: string[]` | Management daily/monthly pages | ⚠️ Reads branch names as plain strings — no FK validation; will show stale names if branch list changes |

### Pages (`app/`)

| Page | Path | Role Gate | Status |
|---|---|---|---|
| Root redirect | `app/page.tsx` | None | Redirect to `/login` |
| Login | `app/(auth)/` | None | Auth form |
| Forgot password | `app/forgot-password/` | None | Password reset request |
| Reset password | `app/reset-password/` | None | Token-based reset |
| Set password | `app/set-password/` | None | First-time password set |
| Management layout | `app/management/layout.tsx` | `MANAGEMENT` only | Full sidebar nav — fully implemented |
| Gold Loan | `app/management/gold-loan/page.tsx` | `MANAGEMENT` | Renders `BranchDetailView` — **stub** |
| ML Loan | `app/management/ml-loan/` | `MANAGEMENT` | Placeholder |
| Vehicle Loan | `app/management/vehicle-loan/` | `MANAGEMENT` | Placeholder |
| Personal Loan | `app/management/personal-loan/` | `MANAGEMENT` | Placeholder |
| Supermarket | `app/management/supermarket/` | `MANAGEMENT` | Placeholder |
| Daily | `app/management/daily/` | `MANAGEMENT` | Cross-branch daily view |
| Monthly | `app/management/monthly/` | `MANAGEMENT` | Monthly aggregation view |
| Alerts | `app/management/alerts/` | `MANAGEMENT` | Alert list |
| Dashboards | `app/management/dashboards/` | `MANAGEMENT` | Custom dashboard builder |
| Admin root | `app/admin/` | `ADMIN`, `SUPER_ADMIN` | Admin area |
| Employee | `app/employee/` | `EMPLOYEE` | Upload-only view |
| Error | `app/error.tsx` | — | Global error boundary |
| Not found | `app/not-found.tsx` | — | 404 page |

---

## 2. REQUIRED SECTIONS (from Reference HTML Dashboard)

Sections derived from the `tech-plan-and-ai-prompt.md` technical specification and the Gold Loan dashboard reference.

### Section 1 — Page Header & Period Selector
| Attribute | Value |
|---|---|
| **Decision** | **Modify** |
| **Current state** | `app/management/layout.tsx` has a sticky header with logo, user info, nav tabs, and branch dropdown. No period selector (FTD/MTD/YTD). |
| **Data source** | `UserSession.name`, `UserSession.role`, `?period=FTD\|MTD\|YTD` URL param |
| **Missing data** | Period selector (FTD/MTD/YTD toggle), `asOnDate` date picker, `companySlug` in URL params |
| **Reuse risk** | Layout hardcodes `session.user.role === "MANAGEMENT"` check inline — will break for SUPER_ADMIN viewing management view |

### Section 2 — Executive Summary KPI Grid
| Attribute | Value |
|---|---|
| **Decision** | **Modify** |
| **Current state** | `BranchDetailView` renders 4 KPICards (closingBalance, disbursement, collection, npa). `KPICard` component is well-built with INR formatting, trend indicator, hover tooltip. |
| **Data source** | `GET /api/dashboard?period=FTD` → `KpiSnapshot.{ totalOutstanding, totalDisbursed, totalCollected, npaAmount, npaPercent, activeAccountCount, newCustomerCount, closureCount }` |
| **Missing data** | `gramsReleased`, `highRiskCount`, `totalGoldGrams` fields not in current `BranchDetailView` data shape; no FTD/MTD/YTD period switching; no `companyId` scoping |
| **Reuse risk** | `KPICard` assumes `value` is always numeric INR — `activeAccountCount` and `newCustomerCount` are counts, not currency; will render as ₹ amounts incorrectly |

### Section 3 — Disbursement & Collection Chart
| Attribute | Value |
|---|---|
| **Decision** | **Modify** |
| **Current state** | `DisbursementTrendChart.tsx` exists (1.7 KB) — trend line chart. `CollectionEfficiencyChart.tsx` exists (3.3 KB). Both separate components. |
| **Data source** | `GET /api/dashboard` → `KpiSnapshot.totalDisbursed`, `KpiSnapshot.totalCollected`; time-series from `GoldLoanTxn[]` grouped by date |
| **Missing data** | Combined disbursement + collection on single chart with dual-axis; period toggle (FTD/MTD/YTD); no `GoldLoanTxn` time-series data exists yet (depends on Step 6.2) |

### Section 4 — Bucket-wise Overdue Analysis
| Attribute | Value |
|---|---|
| **Decision** | **Modify** |
| **Current state** | `DpdBucketChart.tsx` exists (2.5 KB) — stacked bar chart. `WidgetRenderer` also has `dpd_buckets` case. |
| **Data source** | `KpiSnapshot.{ bucket_0_30_amount, bucket_31_60_amount, bucket_61_90_amount, bucket_90_plus_amount }` |
| **Missing data** | Current `DpdBucketChart` uses `{ bucket, count, amount }[]` shape from `BranchDetailView` — not aligned with `KpiSnapshot` flat fields; no account-count column shown alongside amount |

### Section 5 — New Customers
| Attribute | Value |
|---|---|
| **Decision** | **New** |
| **Current state** | No dedicated component exists. `KPICard` could show the count but no branch-breakdown sub-table exists. |
| **Data source** | `KpiSnapshot.newCustomerCount`; branch breakdown from `GoldLoanAccount[]` where `disbursementDate` falls in period, grouped by `branch` |
| **Missing data** | Branch-level breakdown of new customers; trend vs prior period |

### Section 6 — Closed Gold Loan / Grams Released
| Attribute | Value |
|---|---|
| **Decision** | **New** |
| **Current state** | No component. `KpiSnapshot.closureCount` and `KpiSnapshot.gramsReleased` are defined in DATA_CONTRACTS but not in current `BranchDetailView` data. |
| **Data source** | `KpiSnapshot.closureCount`, `KpiSnapshot.gramsReleased` |
| **Missing data** | Both fields require `GoldLoanTxn` records of type `Closure` (Step 6.2) to be computed |

### Section 7 — High Risk Accounts Table
| Attribute | Value |
|---|---|
| **Decision** | **New** |
| **Current state** | `WidgetRenderer` has a `branch_table` case but it only shows branch + amount. No high-risk account table with account-level rows. |
| **Data source** | `GET /api/dashboard/high-risk` → `GoldLoanAccount[]` filtered by `ltvPercent > 75`, sorted desc, max 100 rows |
| **Missing data** | `GoldLoanAccount` model does not yet exist in schema (Step 3.1); entire endpoint is new |

### Section 8 — NPA & Risk Monitoring
| Attribute | Value |
|---|---|
| **Decision** | **Modify** |
| **Current state** | `GnpaGauge.tsx` exists (2.6 KB) — radial gauge. `WidgetRenderer` has `gauge` case. |
| **Data source** | `KpiSnapshot.npaAmount`, `KpiSnapshot.npaPercent`, `KpiSnapshot.highRiskCount` |
| **Missing data** | NPA threshold (5%) is hardcoded in `GnpaGauge` — not configurable; no `highRiskCount` displayed alongside gauge; no trend vs prior period |

### Section 9 — Branch Performance Table
| Attribute | Value |
|---|---|
| **Decision** | **Modify** |
| **Current state** | `BranchComparisonChart.tsx` (7.9 KB) exists — comparative bar chart. `WidgetRenderer` has `branch_table` case (branch + amount only). |
| **Data source** | Aggregated `KpiSnapshot[]` grouped by `branch` for the selected period; columns: branch, outstanding, disbursed, collected, NPA%, new customers |
| **Missing data** | Multi-column branch table does not exist; current `branch_table` widget only shows 2 columns; no client-side sort; no per-branch `KpiSnapshot` exists yet |

### Section 10 — Alerts & Exceptions Feed
| Attribute | Value |
|---|---|
| **Decision** | **Modify** |
| **Current state** | `LiveUploadFeed.tsx` (3.1 KB) — real-time Pusher feed. `app/management/alerts/` page exists. `hooks/useAlerts.ts` exists. |
| **Data source** | `GET /api/alerts` → `Alert[]`; Pusher channel `alerts` for real-time push |
| **Missing data** | Severity badge (INFO / WARNING / CRITICAL) not in current `Alert` model; no `severity` field in `prisma/schema.prisma`; filtering/pagination on alerts page not confirmed |

### Section 11 — Missing Branch Banner
| Attribute | Value |
|---|---|
| **Decision** | **Reuse** |
| **Current state** | `MissingBranchBanner.tsx` exists in `components/shared/`. `DailySnapshot.missingBranches` is a `String[]` in schema. |
| **Data source** | `DailySnapshot.missingBranches` |
| **Missing data** | None — fully functional for current schema. Post Step 3.1: should validate against canonical Branch list rather than free strings. |

### Section 12 — Employee Upload Page
| Attribute | Value |
|---|---|
| **Decision** | **Rebuild** |
| **Current state** | `app/employee/` exists but only has `SignOutButton`. No upload UI component. |
| **Data source** | `POST /api/upload`, `GET /api/upload/:id` for status polling |
| **Missing data** | Drag-drop component, MIME validation, progress bar, 5s polling status, row count display — all missing |

---

## 3. COMPONENT DEPENDENCY TREE

```
app/layout.tsx
  ├── AuthProvider  (components/providers/AuthProvider.tsx)
  └── QueryProvider (components/providers/QueryProvider.tsx)

app/management/layout.tsx  [ManagementLayout]
  └── EventsProvider  (components/providers/EventsProvider.tsx)
      └── [Pusher client init — no children rendered]

app/management/gold-loan/page.tsx
  └── BranchDetailView  (components/management/BranchDetailView.tsx)
      ├── KPICard  (components/management/KPICard.tsx)  ×4
      └── DpdBucketChart  (components/management/DpdBucketChart.tsx)
          └── Recharts BarChart (external)

app/management/daily/page.tsx  [inferred]
  ├── BranchComparisonChart  (components/management/BranchComparisonChart.tsx)
  │   └── Recharts BarChart (external)
  ├── DisbursementTrendChart  (components/management/DisbursementTrendChart.tsx)
  │   └── Recharts LineChart (external)
  ├── CollectionEfficiencyChart  (components/management/CollectionEfficiencyChart.tsx)
  │   └── Recharts LineChart (external)
  ├── BranchUploadStatus  (components/management/BranchUploadStatus.tsx)
  ├── LiveUploadFeed  (components/management/LiveUploadFeed.tsx)
  │   └── EventsProvider → Pusher channel subscription
  └── MissingBranchBanner  (components/shared/MissingBranchBanner.tsx)

app/management/dashboards/page.tsx  [inferred]
  ├── WidgetCanvas  (components/dashboard-builder/WidgetCanvas.tsx)
  │   └── WidgetRenderer  (components/dashboard-builder/WidgetRenderer.tsx)  ×N
  │       ├── Recharts BarChart / LineChart / PieChart / RadialBarChart (external)
  │       └── useDashboardData hook  (components/dashboard-builder/hooks/)
  ├── WidgetSidebar  (components/dashboard-builder/WidgetSidebar.tsx)
  ├── WidgetConfigPanel  (components/dashboard-builder/WidgetConfigPanel.tsx)
  └── ExportButton  (components/dashboard-builder/ExportButton.tsx)

app/admin/layout.tsx
  └── AdminNav  (components/admin/AdminNav.tsx)

app/employee/page.tsx
  └── SignOutButton  (components/employee/SignOutButton.tsx)
```

**Hook dependency map:**
```
hooks/useDashboardData.ts   →  GET /api/dashboard  (TanStack Query)
hooks/useAlerts.ts          →  GET /api/alerts     (TanStack Query)
hooks/useUsers.ts           →  GET /api/users      (TanStack Query)
hooks/useServerEvents.ts    →  Pusher channel subscription
components/dashboard-builder/hooks/useDashboardData.ts
                            →  GET /api/dashboard  (TanStack Query; separate from root hooks/)
```

> ⚠️ **Naming collision:** `hooks/useDashboardData.ts` (root) and `components/dashboard-builder/hooks/useDashboardData.ts` are two different files with the same name. Both call `/api/dashboard` but with different parameter shapes. This MUST be resolved in Step 7.3.

---

## 4. DESIGN TOKEN EXTRACTION

### Primary Colours

Extracted from `tailwind.config.ts` and inline styles in `app/management/layout.tsx`:

| Token Name | Hex | Usage |
|---|---|---|
| `primary` / `supra-green` | `#064734` | Headers, active states, text, borders on hover |
| `text-muted` | `#4a7c5f` | Secondary text, inactive nav items |
| `background` | `#f7fff0` | Page background |
| `surface` | `#ffffff` | Card backgrounds |
| `elevated` / `accent` | `#E0FFC2` / `#f0fce8` | Hover states, accent fills |
| `border` | `#c8e6c0` | Card and nav borders |
| `warning` / gold-loan branch | `#b45309` | Gold Loan accent, warning states |
| `danger` / `supra-red` | `#991b1b` | NPA / error states |
| `accent-dim` | `#d4f5a8` | Dimmed accent |

### Branch Colour Map

| Branch | Hex |
|---|---|
| Supermarket | `#064734` |
| Gold Loan | `#b45309` |
| MF/ML Loan | `#0a5c43` |
| Vehicle Loan | `#991b1b` |
| Personal Loan | `#4a7c5f` |

### Chart Colour Palette

From `WidgetRenderer.tsx`:
```
COLORS = [
  "#6366f1",  // indigo  — primary chart series
  "#22c55e",  // green   — positive/collection
  "#f59e0b",  // amber   — DPD 0-30 / warning
  "#ef4444",  // red     — DPD 90+ / NPA / danger
  "#8b5cf6",  // violet  — 5th series
  "#06b6d4",  // cyan    — 6th series
]
```

> ⚠️ **Mismatch:** `WidgetRenderer` chart palette uses generic indigo/green/amber/red — NOT the Supra Pacific brand palette from `tailwind.config.ts`. Steps 8.x must standardise to brand palette.

**Recommended Gold Loan chart palette (aligned to brand):**
```
Disbursement:  #064734  (supra-green)
Collection:    #0a5c43  (primary-hover)
DPD Current:  #E0FFC2  (supra-mint)
DPD 0-30:     #b45309  (warning/gold)
DPD 31-60:    #f59e0b  (amber)
DPD 61-90:    #ef4444  (red)
DPD 90+:      #991b1b  (supra-red)
NPA:          #991b1b  (supra-red)
```

### Font Sizes

From component inspection and Tailwind usage:

| Tailwind Class | px equiv | rem equiv | Usage |
|---|---|---|---|
| `text-[10px]` | 10px | 0.625rem | Logo sub-label, tracking-widest captions |
| `text-xs` | 12px | 0.75rem | KPI labels, subtext, tooltips |
| `text-sm` | 14px | 0.875rem | Nav items, table cells, body |
| `text-base` | 16px | 1rem | Default body |
| `text-lg` | 18px | 1.125rem | Section headings |
| `text-xl` | 20px | 1.25rem | Card titles |
| `text-2xl` | 24px | 1.5rem | Gauge value display |
| `text-3xl` | 30px | 1.875rem | KPICard primary value |
| `font-data` var | mono | — | All numeric values (tabular-nums) |

### Spacing Scale

| Tailwind | px | Usage |
|---|---|---|
| `p-2` | 8px | Widget inner padding |
| `p-4` | 16px | Page padding (mobile) |
| `p-6` | 24px | Card padding, section padding |
| `gap-2` | 8px | Icon + text gaps |
| `gap-4` | 16px | KPI card grid gap |
| `gap-6` | 24px | Section vertical gap |
| `rounded-3xl` | 24px | KPICard border radius |
| `rounded-2xl` | 20px | Dropdown, large modals |
| `rounded-xl` | 16px | Most cards |

### Shadow Scale

From `tailwind.config.ts` custom shadows:
```
card:       0 2px 12px rgba(6,71,52,0.07)     — default card
card-hover: 0 6px 24px rgba(6,71,52,0.12)     — on hover
green-glow: 0 0 20px rgba(6,71,52,0.15)       — active/focused states
mint-glow:  0 0 20px rgba(224,255,194,0.6)    — accent highlights
```

---

## 5. GAP SUMMARY

Every missing section or field blocking a pixel-accurate Gold Loan dashboard rebuild:

### Schema Gaps (blocking Steps 8.x until Step 3.1 done)
- `GoldLoanAccount` model does not exist — blocks Sections 5, 6, 7, 9
- `GoldLoanTxn` model does not exist — blocks Sections 3, 6
- `KpiSnapshot` model does not exist — blocks ALL KPI sections (2, 3, 4, 5, 6, 8, 9)
- `Alert.severity` field missing from schema — blocks Section 10 severity badges
- `Portfolio` and `Company` models missing — block tenant-scoped queries

### Data Shape Gaps (existing components)
- `BranchDetailView` exposes only 4 KPIs; full Gold Loan dashboard requires ≥12
- `DpdBucketChart` uses `{ bucket, count, amount }[]` shape; `KpiSnapshot` uses flat fields `bucket_0_30_amount` etc. — adapter needed
- `WidgetRenderer` uses `data as any` with no type guard — silently fails on wrong shape
- `KPICard` renders all values as INR; needs `format` prop to support `count`, `percent`, `grams` formats
- `WidgetConfigPanel` DATA_SOURCES only includes `daily_snapshot` / `monthly_snapshot` — missing `kpi_snapshot`

### Missing Components (net-new required)
- `PeriodSelector` — FTD / MTD / YTD toggle for URL param `?period=`
- `DatePicker` — `asOnDate` selector for historical queries
- `HighRiskAccountsTable` — account-level rows with LTV, DPD, branch columns
- `NewCustomerSection` — count + branch breakdown
- `ClosureSection` — closure count + grams released
- `BranchPerformanceTable` — multi-column sortable table (replace single-column `branch_table` widget)
- `UploadZone` — drag-drop file input with MIME validation
- `UploadStatusPoller` — 5s interval TanStack Query refetch + progress display

### Missing Hooks / API Endpoints
- `useGoldLoanDashboard(period, asOnDate)` hook — not yet built (Step 7.3)
- `GET /api/dashboard/high-risk` — not yet built
- `GET /api/dashboard/branch-performance` — not yet built
- `POST /api/upload` fully implemented with state machine — exists but no magic-byte validation yet (Step 5.1)

### Naming & Architecture Gaps
- `hooks/useDashboardData.ts` vs `components/dashboard-builder/hooks/useDashboardData.ts` — name collision; resolve in Step 7.3
- No `lib/domain/index.ts` yet — all types scattered across `lib/types.ts`, `types/`, `DATA_CONTRACTS.md` — unify in Step 4.3
- `dashboard-app/` root directory — purpose unknown; must be investigated before Step 2.1 close-out
- SWR still present alongside TanStack Query — remove in Step migration Step 7 (per REBUILD_ROADMAP)

### Design Token Gaps
- `WidgetRenderer` chart palette (`#6366f1` indigo series) is NOT aligned to Supra Pacific brand palette — standardise in Step 8.1
- No dark mode tokens defined for financial values — `darkMode: "class"` is configured in Tailwind but no dark variants are used in existing components

---

## End of Audit

**Files changed:** 1 (`DASHBOARD_UI_AUDIT.md` created)  
**Code changes:** None — analysis only  
**Manual test steps:**
1. Open [DASHBOARD_UI_AUDIT.md](https://github.com/Dhanushmcmsd/Dashboard/blob/main/DASHBOARD_UI_AUDIT.md) in GitHub and confirm all 5 sections render
2. Cross-check Section 1 component table against `components/` directory — every file should appear
3. Verify Section 5 Gap Summary lists `KpiSnapshot` as blocking — confirms Step 3.1 is the correct next step
4. Confirm `dashboard-app/` is flagged as unknown in Gap Summary — investigation needed before Step 3.1

**Git commit message:**
```
docs(batch-2): add DASHBOARD_UI_AUDIT.md — component inventory, section mapping, dependency tree, design tokens, gap summary
```
