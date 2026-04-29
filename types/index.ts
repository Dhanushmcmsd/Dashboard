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
  closingBalance: number;
  disbursement: number;
  collection: number;
  npa: number;
  dpdBuckets: Record<DpdBucket, { count: number; amount: number }>;
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
