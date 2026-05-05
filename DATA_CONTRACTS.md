# DATA CONTRACTS — Canonical TypeScript Interfaces

> **These are the authoritative type definitions for all cross-layer data shapes.**  
> All future code (server actions, parsers, UI components, hooks) MUST import from here — never redefine.

---

```typescript
// ─── Enums ───────────────────────────────────────────────────────────────────

export enum UserRole {
  super_admin = 'super_admin',   // Cross-company access, admin UI
  company_admin = 'company_admin', // Single-company access, full dashboard
  employee = 'employee',          // Single-company access, upload only
}

export enum PortfolioType {
  gold_loan = 'gold_loan',
  pledge_loan = 'pledge_loan',
  ml_loan = 'ml_loan',
  personal_loan = 'personal_loan',
  vehicle_loan = 'vehicle_loan',
}

export enum UploadStatus {
  pending = 'pending',
  processing = 'processing',
  success = 'success',
  failed = 'failed',
  partial_success = 'partial_success',
}

export enum FileType {
  loan_balance = 'loan_balance',
  transaction = 'transaction',
}

export enum LoanBucket {
  current = 'current',
  bucket_0_30 = '0_30',     // DPD >= 0 AND < 31
  bucket_31_60 = '31_60',   // DPD >= 31 AND < 61
  bucket_61_90 = '61_90',   // DPD >= 61 AND < 91
  bucket_90_plus = '90_plus', // DPD >= 91
}

export enum PeriodType {
  FTD = 'FTD', // For the Day
  MTD = 'MTD', // Month to Date
  YTD = 'YTD', // Year to Date (financial year starts April 1)
}

export enum TxnType {
  Disbursement = 'Disbursement',
  Collection = 'Collection',
  Interest = 'Interest',
  Penalty = 'Penalty',
  Closure = 'Closure',
}

// ─── Core Interfaces ──────────────────────────────────────────────────────────

export interface Company {
  id: string;
  slug: string;           // URL-safe unique identifier (e.g. 'supra-pacific')
  name: string;
  is_active: boolean;
  created_at: Date;
}

export interface Portfolio {
  id: string;
  company_id: string;     // tenant isolation key
  type: PortfolioType;
  is_active: boolean;
  phase: number;          // 1 = live, 0 = scaffolded/coming soon
}

export interface UploadRecord {
  id: string;
  company_id: string;     // tenant isolation key
  portfolio_id: string;
  file_type: FileType;
  as_on_date: Date;       // The business date the data represents
  status: UploadStatus;
  error_message?: string; // Populated on failure or partial success
  uploaded_by: string;    // FK → users.id
  created_at: Date;
  deleted_at?: Date;      // Soft delete — null = active
  row_count?: number;     // Total rows in file
  parsed_count?: number;  // Successfully parsed rows
  failed_count?: number;  // Rows that failed parsing
}

export interface GoldLoanAccount {
  id: string;
  company_id: string;              // tenant isolation key
  upload_id: string;               // FK → data_uploads.id
  account_number: string;          // Unique per company
  customer_name: string;
  branch: string;
  principal_outstanding: number;   // In INR
  gold_weight_grams: number;
  ltv_percent: number;             // Loan-to-Value ratio
  interest_rate: number;           // Annual percentage
  disbursement_date: