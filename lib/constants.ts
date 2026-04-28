import type { BranchName } from "@/types";

export const BRANCHES = ["Supermarket", "Gold Loan", "ML Loan", "Vehicle Loan", "Personal Loan"] as const;
export const DPD_BUCKETS = ["0", "1-30", "31-60", "61-90", "91-180", "181+"] as const;
export const BRANCH_COLORS: Record<BranchName, string> = {
  "Supermarket": "#4F6EF7",
  "Gold Loan": "#F59E0B",
  "ML Loan": "#10B981",
  "Vehicle Loan": "#EC4899",
  "Personal Loan": "#8B5CF6"
};
export const HTTP_STATUS = { OK: 200, CREATED: 201, BAD_REQUEST: 400, UNAUTHORIZED: 401, FORBIDDEN: 403, NOT_FOUND: 404, TOO_MANY_REQUESTS: 429, INTERNAL_ERROR: 500 } as const;
export const PUSHER_CHANNELS = { ALERTS: "private-alerts", UPLOADS: "private-uploads", DASHBOARD: "private-dashboard" } as const;
export const PUSHER_EVENTS = { NEW_ALERT: "new-alert", UPLOAD_COMPLETE: "upload-complete", UPLOAD_FAILED: "upload-failed", DASHBOARD_UPDATED: "dashboard-updated" } as const;
export const UPLOAD_LIMITS = { MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024, ALLOWED_EXCEL_TYPES: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"], ALLOWED_HTML_TYPES: ["text/html"], RATE_LIMIT_PER_MINUTE: 10 } as const;
