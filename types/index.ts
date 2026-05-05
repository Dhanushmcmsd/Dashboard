export const BRANCHES = [
  "Supermarket", "Gold Loan", "ML Loan", "Vehicle Loan", "Personal Loan"
] as const;
export type BranchName = (typeof BRANCHES)[number];

export const DPD_BUCKETS = ["0", "1-30", "31-60", "61-90", "91-180", "181+"] as const;
export type DpdBucket = (typeof DPD_BUCKETS)[number];

/**
 * Canonical role union — must match Prisma Role enum exactly.
 *
 * super_admin    — cross-company access, admin UI
 * company_admin  — single-company access, full dashboard
 * employee       — single-company access, upload only
 */
export type AppRole = "super_admin" | "company_admin" | "employee";

export interface DpdBucketData {
  bucket: DpdBucket;
  count: number;
  amount: number;
}

export interface ParsedRow {
  branch: BranchName;
  closingBalance: number;
  disbursement: number;
  collection: number;
  npa: number;
  dpdBuckets: Record<DpdBucket, { count: number; amount: number }>;
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
 *
 * companyId / companySlug are null only for super_admin.
 */
export interface SessionUser {
  userId: string;
  name: string;
  email: string;
  role: AppRole;
  /** Prisma Company.id — null for super_admin */
  companyId: string | null;
  /** URL-safe company slug — null for super_admin */
  companySlug: string | null;
}

export interface UploadRecord {
  id: string;
  branch: string;
  fileType: "EXCEL" | "HTML" | "CSV";
  fileName: string;
  uploadedAt: string;
  dateKey: string;
  monthKey: string;
  uploadedByName: string;
}
