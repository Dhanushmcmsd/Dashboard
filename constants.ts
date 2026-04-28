// FILE: lib/constants.ts

export const BRANCHES = [
  "Ernakulam Main",
  "Thrissur",
  "Kozhikode",
  "Thiruvananthapuram",
  "Kottayam",
  "Kollam",
  "Palakkad",
  "Malappuram",
  "Kannur",
  "Alappuzha",
] as const;

export type BranchName = (typeof BRANCHES)[number];

export const ROLES = {
  ADMIN: "ADMIN",
  BRANCH_MANAGER: "BRANCH_MANAGER",
  VIEWER: "VIEWER",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const DPD_BUCKETS = ["0", "1-30", "31-60", "61-90", "91-180", "181+"] as const;
export type DpdBucket = (typeof DPD_BUCKETS)[number];

export const BRANCH_COLORS: Record<string, string> = {
  "Ernakulam Main": "#3B82F6",
  Thrissur: "#10B981",
  Kozhikode: "#F59E0B",
  Thiruvananthapuram: "#EF4444",
  Kottayam: "#8B5CF6",
  Kollam: "#EC4899",
  Palakkad: "#06B6D4",
  Malappuram: "#84CC16",
  Kannur: "#F97316",
  Alappuzha: "#6366F1",
};

export const CACHE_TTL = {
  DAILY_DASHBOARD: 2 * 60, // 2 minutes in seconds
  MONTHLY_DASHBOARD: 10 * 60, // 10 minutes in seconds
  ALERTS: 60,
} as const;

export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024, // 5MB
  ALLOWED_MIME_TYPES: [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
  ],
  RATE_LIMIT_PER_MINUTE: 10,
} as const;

export const API_RESPONSE = {
  SUCCESS: true,
  FAILURE: false,
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
} as const;
