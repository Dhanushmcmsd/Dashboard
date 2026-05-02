"use client";

import useSWR, { SWRConfiguration } from "swr";
import type { WidgetConfig } from "@/lib/types";

// ---------------------------------------------------------------------------
// Global SWR config — import this into your SWRConfig provider in layout.tsx
// ---------------------------------------------------------------------------
export const swrDashboardConfig: SWRConfiguration = {
  dedupingInterval: 30_000, // 30 s — same widget won't refetch within this window
  revalidateOnFocus: false,  // dashboards are read-heavy, no surprise refetch
  revalidateOnReconnect: true,
};

// ---------------------------------------------------------------------------
// Generic fetcher
// ---------------------------------------------------------------------------
async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Build the endpoint URL from a WidgetConfig
// ---------------------------------------------------------------------------
function buildUrl(config: WidgetConfig): string | null {
  if (config.dataSource === "daily_snapshot") {
    const params = new URLSearchParams();
    if (config.dateRange?.from) params.set("date", config.dateRange.from);
    if (config.filters?.branchIds?.length) {
      params.set("branchId", config.filters.branchIds.join(","));
    }
    return `/api/dashboard/daily?${params.toString()}`;
  }

  if (config.dataSource === "monthly_snapshot") {
    const params = new URLSearchParams();
    if (config.dateRange?.from) {
      const d = new Date(config.dateRange.from);
      params.set("month", String(d.getMonth() + 1));
      params.set("year", String(d.getFullYear()));
    }
    return `/api/dashboard/monthly?${params.toString()}`;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useDashboardData<T = unknown>(config: WidgetConfig) {
  const url = buildUrl(config);

  const { data, error, isLoading, mutate } = useSWR<T>(
    url, // null key → SWR skips fetching
    fetcher,
    swrDashboardConfig
  );

  return { data, isLoading, error: error as Error | undefined, mutate };
}
