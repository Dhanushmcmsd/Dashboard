// FILE: types/index.ts

import type { BranchName, DpdBucket, Role } from "@/lib/constants";

// ─── API Response Shape ───────────────────────────────────────────────────────
export interface ApiResponse<T = undefined> {
  success: boolean;
  data?: T;
  error?: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  branchId: string | null;
  branchName: BranchName | null;
}

// ─── Branch ──────────────────────────────────────────────────────────────────
export interface Branch {
  id: string;
  name: BranchName;
  code: string;
  createdAt: string;
}

// ─── Upload ──────────────────────────────────────────────────────────────────
export type UploadStatus = "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED";
export type UploadType = "DAILY" | "MONTHLY";

export interface UploadRecord {
  id: string;
  fileName: string;
  uploadType: UploadType;
  status: UploadStatus;
  uploadedBy: string;
  branchName: BranchName;
  errorMessage: string | null;
  createdAt: string;
  processedAt: string | null;
}

// ─── DPD Bucket ──────────────────────────────────────────────────────────────
export interface DpdBucketData {
  bucket: DpdBucket;
  count: number;
  amount: number;
}

// ─── Daily Dashboard ─────────────────────────────────────────────────────────
export interface BranchDailyMetric {
  branchId: string;
  branchName: BranchName;
  closingBalance: number;
  disbursement: number;
  collection: number;
  npa: number;
  dpdBuckets: DpdBucketData[];
  date: string;
}

export interface DailyDashboardData {
  date: string;
  lastUpdated: string;
  topBranch: BranchName | null;
  branches: BranchDailyMetric[];
  totals: {
    closingBalance: number;
    disbursement: number;
    collection: number;
    npa: number;
  };
}

// ─── Monthly Dashboard ───────────────────────────────────────────────────────
export interface BranchMonthlyMetric {
  branchId: string;
  branchName: BranchName;
  month: string;
  closingBalance: number;
  disbursement: number;
  collection: number;
  npa: number;
  growthPercent: number | null;
  trend: "up" | "down" | "neutral";
  dpdBuckets: DpdBucketData[];
}

export interface MonthlyDashboardData {
  month: string;
  lastUpdated: string;
  branches: BranchMonthlyMetric[];
  totals: {
    closingBalance: number;
    disbursement: number;
    collection: number;
    npa: number;
  };
}

// ─── Alerts ──────────────────────────────────────────────────────────────────
export type AlertSeverity = "INFO" | "WARNING" | "CRITICAL";

export interface Alert {
  id: string;
  message: string;
  severity: AlertSeverity;
  branchName: BranchName | null;
  isRead: boolean;
  createdAt: string;
}

// ─── Excel Parse Result ──────────────────────────────────────────────────────
export interface ParsedExcelRow {
  branchName: string;
  closingBalance: number;
  disbursement: number;
  collection: number;
  npa: number;
  dpdBuckets: Record<DpdBucket, { count: number; amount: number }>;
}
