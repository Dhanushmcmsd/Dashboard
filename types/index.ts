export const BRANCHES = [
  "Supermarket", "Gold Loan", "ML Loan", "Vehicle Loan", "Personal Loan"
] as const;
export type BranchName = (typeof BRANCHES)[number];

export const DPD_BUCKETS = ["0", "1-30", "31-60", "61-90", "91-180", "181+"] as const;
export type DpdBucket = (typeof DPD_BUCKETS)[number];

export interface DpdBucketData {
  bucket: DpdBucket;
  count: number;
  amount: number;
}

export interface ParsedRow {
  branch: BranchName;
  // Core metrics used across all dashboards
  closingBalance: number;     // Total AUM
  disbursement: number;       // MTD disbursement
  collection: number;         // Principal + interest collected
  npa: number;                // GNPA amount (DPD > 90)
  dpdBuckets: Record<DpdBucket, { count: number; amount: number }>;

  // Extended Gold Loan / Loan metrics (optional — populated when source is Loan Balance Statement)
  totalAccounts?: number;
  totalCustomers?: number;
  avgYield?: number;           // Average interest rate %
  ftdDisbursement?: number;
  mtdDisbursement?: number;
  ytdDisbursement?: number;
  goldPledgedGrams?: number;   // Gold Loan only
  gnpaAmount?: number;
  gnpaPct?: number;            // GNPA % = gnpaAmount / closingBalance
  overdueAmount?: number;      // DPD > 0 closing balance sum
  overduePct?: number;         // overdueAmount / closingBalance
  avgTicketSize?: number;      // closingBalance / totalAccounts
  avgGoldPerLoan?: number;     // goldPledgedGrams / totalAccounts
  principalCollection?: number;
  interestCollection?: number;
  collectionEfficiency?: number; // from transaction statement
  reportDateRange?: string;    // e.g. "01-04-2026 to 08-04-2026"
  fileType?: "LOAN_BALANCE" | "TRANSACTION" | "SUMMARY";
}

export interface BranchDailyMetric extends ParsedRow {
  uploadedBy: string;
  uploadedAt: string;
  fileName: string;
}

export interface DailyDashboardData {
  dateKey: string;
  lastUpdated: string;
  uploadedBranches: BranchName[];
  missingBranches: BranchName[];
  branches: BranchDailyMetric[];
  totals: {
    closingBalance: number;
    disbursement: number;
    collection: number;
    npa: number;
  };
}

export interface BranchMonthlyMetric extends BranchDailyMetric {
  growthPercent: number | null;
  trend: "up" | "down" | "neutral";
}

export interface MonthlyDashboardData {
  monthKey: string;
  lastUpdated: string;
  branches: BranchMonthlyMetric[];
  totals: {
    closingBalance: number;
    disbursement: number;
    collection: number;
    npa: number;
  };
}

export interface AlertRecord {
  id: string;
  message: string;
  sentBy: string;
  sentByName: string;
  sentAt: string;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "EMPLOYEE" | "MANAGEMENT";
  branches: string[];
  isActive: boolean;
  passwordSet: boolean;
  createdAt: string;
}

export interface ApiResponse<T = undefined> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "EMPLOYEE" | "MANAGEMENT";
  branches: string[];
}

export interface UploadRecord {
  id: string;
  branch: string;
  fileType: "EXCEL" | "HTML";
  fileName: string;
  uploadedAt: string;
  dateKey: string;
  monthKey: string;
  uploadedByName: string;
}
