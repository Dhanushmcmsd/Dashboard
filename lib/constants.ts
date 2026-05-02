import { BranchName, DpdBucket } from "@/types";

export const BRANCHES: BranchName[] = [
  "Supermarket",
  "Gold Loan",
  "ML Loan",
  "Vehicle Loan",
  "Personal Loan",
];

export const DPD_BUCKETS: DpdBucket[] = [
  "0",
  "1-30",
  "31-60",
  "61-90",
  "91-180",
  "181+",
];

export const BRANCH_COLORS: Record<BranchName, string> = {
  Supermarket: "#4F6EF7",
  "Gold Loan": "#F59E0B",
  "ML Loan": "#10B981",
  "Vehicle Loan": "#EC4899",
  "Personal Loan": "#8B5CF6",
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

// SSE event type names — used by app/api/events/route.ts and publishEvent
export const SSE_EVENTS = {
  UPLOAD_COMPLETE: "upload-complete",
  DASHBOARD_UPDATED: "dashboard-updated",
  NEW_ALERT: "new-alert",
};

export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE_MB: 5,
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024,
  ALLOWED_EXTENSIONS: [".xlsx", ".html"],
};
