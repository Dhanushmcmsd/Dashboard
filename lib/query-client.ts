import { QueryClient } from "@tanstack/react-query";
import { ApiResponse } from "@/types";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient();
  } else {
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

export const QUERY_KEYS = {
  USERS: ["users"],
  ALERTS: ["alerts"],
  UPLOAD_HISTORY: ["upload-history"],
  DAILY_DASHBOARD: (dateKey: string) => ["daily-dashboard", dateKey],
  MONTHLY_DASHBOARD: (monthKey: string) => ["monthly-dashboard", monthKey],
  BRANCH_DASHBOARD: (branch: string) => ["branch-dashboard", branch],
};

export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const json: ApiResponse<T> = await res.json();
  if (!json.success) {
    throw new Error(json.error || "An error occurred");
  }
  return json.data as T;
}
