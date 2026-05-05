export const BRANCHES = [
  "Supermarket", "Gold Loan", "ML Loan", "Vehicle Loan", "Personal Loan"
] as const;
export type BranchName = (typeof BRANCHES)[number];

export const DPD_BUCKETS = ["0", "1-30", "31-60", "61-90", "91-180", "181+"] as const;
export type DpdBucket = (typeof DPD_BUCKETS)[number];

/** Must match Prisma Role enum exactly */
export type AppRole = "SUPER_ADMIN" | "ADMIN" | "MANAGEMENT" | "EMPLOYEE";

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

  // Extended Gold Loan / Loan metrics (optional)
  totalAccounts?: number;
  totalCustomers?: number;
  avgYield?: number;
  ftdDisbursement?: number;
  mtdDisbursement?: number;
  ytdDisbursement?: number;
  goldPledgedGrams?: number;
  gnpaAmount?: number;
  gnpaPct?: number;
  overdueAmount?: number;
  overduePct?: number;
  avgTicketSize?: number;
  avgGoldPerLoan?: number;
  principalCollection?: number;
  interestCollection?: number;
  collectionEfficiency?: number;
  reportDateRange?: string;
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
  role: AppRole;
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

/**
 * Shape of session.user after NextAuth JWT/Session callbacks.
 * organizationId is null only for SUPER_ADMIN.
 */
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  branches: string[];
  /**
   * The organization this user belongs to.
   * null for SUPER_ADMIN (they span all orgs).
   * Must be present for all other roles.
   */
  organizationId: string | null;
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
