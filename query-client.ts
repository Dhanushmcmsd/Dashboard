// FILE: lib/query-client.ts

import { QueryClient } from "@tanstack/react-query";

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute default
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          // Don't retry on 401/403/404
          if (error instanceof ApiError && [401, 403, 404].includes(error.status)) return false;
          return failureCount < 2;
        },
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// ─── Typed fetch helper ───────────────────────────────────────────────────────
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  const json = await res.json().catch(() => ({ success: false, error: "Invalid JSON response" }));

  if (!res.ok || !json.success) {
    throw new ApiError(res.status, json.error ?? "An unexpected error occurred");
  }

  return json.data as T;
}

export const QUERY_KEYS = {
  dailyDashboard: (date?: string) => ["dashboard", "daily", date ?? "latest"] as const,
  monthlyDashboard: (month?: string) => ["dashboard", "monthly", month ?? "latest"] as const,
  uploadHistory: (params?: object) => ["uploads", params ?? {}] as const,
  alerts: (params?: object) => ["alerts", params ?? {}] as const,
  unreadAlertCount: () => ["alerts", "unread-count"] as const,
} as const;
