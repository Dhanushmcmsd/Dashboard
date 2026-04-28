// FILE: lib/validations.ts

import { z } from "zod";
import { BRANCHES, DPD_BUCKETS, ROLES, UPLOAD_LIMITS } from "./constants";

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const RegisterSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum([ROLES.ADMIN, ROLES.BRANCH_MANAGER, ROLES.VIEWER]),
  branchName: z.enum(BRANCHES).optional().nullable(),
});

// ─── Upload ──────────────────────────────────────────────────────────────────
export const UploadQuerySchema = z.object({
  branchId: z.string().uuid().optional(),
  type: z.enum(["DAILY", "MONTHLY"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const UploadFileSchema = z.object({
  branchName: z.enum(BRANCHES, { errorMap: () => ({ message: "Invalid branch name" }) }),
  uploadType: z.enum(["DAILY", "MONTHLY"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
});

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const DashboardQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
    .optional(),
  branchId: z.string().uuid().optional(),
});

export const MonthlyDashboardQuerySchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Month must be YYYY-MM")
    .optional(),
  branchId: z.string().uuid().optional(),
});

// ─── Alerts ──────────────────────────────────────────────────────────────────
export const AlertQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  severity: z.enum(["INFO", "WARNING", "CRITICAL"]).optional(),
  unreadOnly: z
    .string()
    .transform((v) => v === "true")
    .optional(),
});

export const MarkAlertReadSchema = z.object({
  alertIds: z.array(z.string().uuid()).min(1).max(100),
});

// ─── Excel Row Validation ─────────────────────────────────────────────────────
export const DpdBucketDataSchema = z.object({
  count: z.number().int().nonnegative(),
  amount: z.number().nonnegative(),
});

export const ParsedExcelRowSchema = z.object({
  branchName: z.enum(BRANCHES),
  closingBalance: z.number({ required_error: "closingBalance is required" }).nonnegative(),
  disbursement: z.number().nonnegative().default(0),
  collection: z.number().nonnegative().default(0),
  npa: z.number().nonnegative().default(0),
  dpdBuckets: z
    .record(z.enum(DPD_BUCKETS), DpdBucketDataSchema)
    .refine((b) => Object.keys(b).length > 0, { message: "dpdBuckets must not be empty" }),
});

export const ParsedExcelDataSchema = z.array(ParsedExcelRowSchema).min(1, "No valid rows found");

// ─── File Validation ──────────────────────────────────────────────────────────
export function validateUploadFile(file: { size: number; type: string }): string | null {
  if (file.size > UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES) {
    return `File size exceeds ${UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB limit`;
  }
  if (!UPLOAD_LIMITS.ALLOWED_MIME_TYPES.includes(file.type as never)) {
    return "Only Excel files (.xlsx, .xls) are allowed";
  }
  return null;
}
