import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS, apiFetch } from "@/lib/query-client";
import { DailyDashboardData, MonthlyDashboardData, BranchDailyMetric } from "@/types";

export function useDailyDashboard(dateKey?: string) {
  return useQuery({
    queryKey: dateKey ? QUERY_KEYS.DAILY_DASHBOARD(dateKey) : ["daily-dashboard", "today"],
    queryFn: () => {
      const url = dateKey ? `/api/dashboard/daily?date=${dateKey}` : "/api/dashboard/daily";
      return apiFetch<DailyDashboardData>(url);
    },
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes as backup
  });
}

export function useMonthlyDashboard(monthKey?: string) {
  return useQuery({
    queryKey: monthKey ? QUERY_KEYS.MONTHLY_DASHBOARD(monthKey) : ["monthly-dashboard", "current"],
    queryFn: () => {
      const url = monthKey ? `/api/dashboard/monthly?month=${monthKey}` : "/api/dashboard/monthly";
      return apiFetch<MonthlyDashboardData>(url);
    },
    refetchInterval: 10 * 60 * 1000,
  });
}

export function useBranchDashboard(branch: string) {
  return useQuery({
    queryKey: QUERY_KEYS.BRANCH_DASHBOARD(branch),
    queryFn: () => apiFetch<BranchDailyMetric & { dpdBuckets: any }>(`/api/dashboard/branch?branch=${encodeURIComponent(branch)}`),
  });
}
