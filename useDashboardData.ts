// FILE: hooks/useDashboardData.ts

import { useQuery } from "@tanstack/react-query";
import { apiFetch, QUERY_KEYS } from "@/lib/query-client";
import type { DailyDashboardData, MonthlyDashboardData } from "@/types";

export function useDailyDashboard(date?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.dailyDashboard(date),
    queryFn: () => {
      const params = date ? `?date=${date}` : "";
      return apiFetch<DailyDashboardData>(`/api/dashboard/daily${params}`);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes — mirrors server cache
  });
}

export function useMonthlyDashboard(month?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.monthlyDashboard(month),
    queryFn: () => {
      const params = month ? `?month=${month}` : "";
      return apiFetch<MonthlyDashboardData>(`/api/dashboard/monthly${params}`);
    },
    staleTime: 10 * 60 * 1000, // 10 minutes — mirrors server cache
  });
}
