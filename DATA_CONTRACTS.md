# DATA CONTRACTS — Canonical TypeScript Interfaces

> **These are the authoritative type definitions for all cross-layer data shapes.**  
> All future code (server actions, parsers, UI components, hooks) MUST match these shapes.
> Do NOT redefine these types locally — import from `lib/domain/index.ts` once that module exists.

---

## Enums

```typescript
// User roles — controls route access and UI visibility
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',     // Cross-company access; admin UI only
  ADMIN = 'ADMIN',                 // Single-company; full dashboard + user mgmt
  MANAGEMENT = 'MANAGEMENT',       // Single-company; read-only dashboard
  EMPLOYEE = 'EMPLOYEE',           // Single-company; upload only
}

// Loan portfolio product types
export enum PortfolioType {
  gold_loan = 'gold_loan',
  pledge_loan = 'pledge_loan',
  ml_loan = 'ml_loan',
  personal_loan = 'personal_loan',
  vehicle_loan = 'vehicle_loan',
}

// Upload lifecycle state machine
export enum UploadStatus {
  pending = 'pending',             // File received, not yet processed
  processing = 'processing',       // Pipeline running
  success = 'success',             // All rows parsed and saved
  failed = 'failed',               // Fatal error; no rows saved
  partial_success = 'partial_success', // Some rows failed; rest saved
}

// Upload file types
export enum FileType {
  EXCEL = 'EXCEL',
  HTML = 'HTML',
}

// Overdue bucket classification by Days Past Due (DPD)
export enum LoanBucket {
  current = 'current',             // DPD = 0
  bucket_0_30 = '0_30',           // DPD >= 1 AND <= 30
  bucket_31_60 = '31_60',         // DPD >= 31 AND <= 60
  bucket_61_90 = '61_90',         // DPD >= 61 AND <= 90
  bucket_90_plus = '90_plus',     // DPD > 90; NPA territory
}

// Reporting period types
export enum PeriodType {
  FTD = 'FTD', // For The Day — data as of selected date only
  MTD = 'MTD', // Month To Date — from 1st of month to selected date
  YTD = 'YTD', // Year To Date — from April 1 (financial year start) to selected date
}

// Transaction types parsed from transaction statement file
export enum TxnType {
  Disbursement = 'Disbursement',   // New loan disbursed
  Collection = 'Collection',       // Repayment received
  Interest = 'Interest',           // Interest credited
  Penalty = 'Penalty',             // Penalty charged
  Closure = 'Closure',             // Loan account closed
}
```

---

## Core Interfaces

```typescript
// ─── Company ─────────────────────────────────────────────────────────────────

export interface Company {
  id: string;          // cuid — primary key
  slug: string;        // URL-safe unique identifier used in routes (e.g. 'supra-pacific')
  name: string;        // Display name (e.g. 'Supra Pacific Finance')
  logoUrl?: string;    // Optional hosted logo URL for white-labelling
  brandColor?: string; // Hex color code for theme (default '#000000')
  isActive: boolean;   // Soft disable without delete
  createdAt: Date;
}

// ─── Portfolio ───────────────────────────────────────────────────────────────

export interface Portfolio {
  id: string;
  companyId: string;        // Tenant isolation key — always required
  type: PortfolioType;      // Which loan product this portfolio tracks
  isActive: boolean;
  phase: number;            // 1 = live data; 0 = coming-soon placeholder
  createdAt: Date;
}

// ─── UploadRecord ─────────────────────────────────────────────────────────────

export interface UploadRecord {
  id: string;
  companyId: string;        // Tenant isolation key
  portfolioId: string;
  fileType: FileType;
  fileName: string;         // Original filename as uploaded
  asOnDate: Date;           // The business date the data represents (NOT upload timestamp)
  status: UploadStatus;
  errorMessage?: string;    // Set on `failed` or `partial_success` — human-readable error
  uploadedBy: string;       // FK → User.id
  createdAt: Date;
  deletedAt?: Date;         // Soft delete — null = active; non-null = logically deleted
  rowCount?: number;        // Total rows found in the source file
  parsedCount?: number;     // Rows successfully parsed and saved
  failedCount?: number;     // Rows that could not be parsed
}

// ─── GoldLoanAccount ──────────────────────────────────────────────────────────

export interface GoldLoanAccount {
  id: string;
  companyId: string;               // Tenant isolation key
  uploadId: string;                // FK → UploadRecord.id (which upload this came from)
  accountNumber: string;           // Unique per company (used for cross-ref validation)
  customerName: string;
  branch: string;                  // Branch name or code
  principalOutstanding: number;    // Outstanding principal balance in INR
  goldWeightGrams: number;         // Total gold pledged in grams
  ltvPercent: number;              // Loan-to-Value ratio (e.g. 72.5 means 72.5%)
  interestRate: number;            // Annual interest rate percentage
  disbursementDate: Date;          // Date loan was originally disbursed
  maturityDate?: Date;             // Scheduled loan end date
  dpd: number;                     // Days Past Due (0 = current)
  bucket: LoanBucket;              // Derived from dpd — set during parsing
  isNpa: boolean;                  // DPD > 90 → NPA classification
  asOnDate: Date;                  // Business date this snapshot represents
  deletedAt?: Date;                // Soft delete when superceded by newer upload
}

// ─── KpiSnapshot ──────────────────────────────────────────────────────────────

export interface KpiSnapshot {
  id: string;
  companyId: string;           // Tenant isolation key
  portfolioId: string;
  asOnDate: Date;              // Business date this KPI set was computed for
  period: PeriodType;          // FTD, MTD, or YTD
  // Disbursement & Collections
  totalDisbursed: number;      // Sum of all Disbursement txns in period (INR)
  totalCollected: number;      // Sum of all Collection txns in period (INR)
  // Portfolio Size
  activeAccountCount: number;  // Accounts with DPD = 0 as of asOnDate
  totalOutstanding: number;    // Sum of principalOutstanding across all active accounts
  totalGoldGrams: number;      // Sum of goldWeightGrams across all active accounts
  // New Business
  newCustomerCount: number;    // Accounts with disbursementDate falling in period
  closureCount: number;        // Closure TxnType events in period
  gramsReleased: number;       // Gold grams released via closures in period
  // Risk
  npaAmount: number;           // Sum of principalOutstanding where isNpa = true
  npaPercent: number;          // npaAmount / totalOutstanding * 100
  highRiskCount: number;       // Accounts with ltvPercent > 75 (configurable threshold)
  // Overdue Buckets (INR outstanding per bucket)
  bucket_0_30_amount: number;
  bucket_31_60_amount: number;
  bucket_61_90_amount: number;
  bucket_90_plus_amount: number;
  computedAt: Date;            // When this KPI was last (re-)computed
}

// ─── UserSession ──────────────────────────────────────────────────────────────
// Shape of the authenticated user available inside server actions and components.
// Matches the JWT token fields injected in lib/auth.ts callbacks.

export interface UserSession {
  userId: string;          // FK → User.id (Prisma)
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;       // False = account deactivated; withCompanyScope() rejects these
  branches: string[];      // Which branches this user can see data for (empty = all)
  organizationId?: string; // FK → Organization.id (multi-tenant context)
  companyId?: string;      // Will equal organizationId post-Step 3.1 schema unification
  companySlug?: string;    // Injected for convenience — used in URL construction
}

// ─── ApiResponse ──────────────────────────────────────────────────────────────
// Wrapper for all API route responses. Keeps client-side error handling consistent.

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;           // Present on success
  error?: string;     // Human-readable error message on failure
  code?: string;      // Machine-readable error code (e.g. 'UNAUTHORIZED', 'NOT_FOUND')
}

// ─── ParseResult ──────────────────────────────────────────────────────────────
// Return type of all file parsers. Enables partial success handling.

export interface ParseResult<T> {
  rows: T[];              // Successfully parsed rows
  errors: ParseError[];   // Per-row errors
  totalRows: number;      // Total rows encountered in file
}

export interface ParseError {
  rowIndex: number;       // 0-based row index in source file
  field?: string;         // Which field failed (null = row-level error)
  message: string;        // Human-readable description
  rawValue?: string;      // The raw value that caused the error
}
```

---

## Field Requirement Legend

| Symbol | Meaning |
|---|---|
| No `?` | Required — must always be present |
| `?` suffix | Optional — may be null/undefined |
| `// FK →` comment | Foreign key relationship |
| `// Tenant isolation key` | Must be included in every Prisma query `where` clause |

---

## Contract Stability Rules

1. **Do not rename fields** without updating ALL consumers (API routes, hooks, components, tests) in the same commit.
2. **Adding optional fields** (`?`) is non-breaking — safe to do at any step.
3. **Adding required fields** is breaking — requires a Prisma migration AND all call sites updated in the same PR.
4. **Enum values** are additive-safe. Removing an enum value is breaking.
5. Record deviations from these contracts in `MIGRATION_NOTES.md` under Confirmed Deviations.
