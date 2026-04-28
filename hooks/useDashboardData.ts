import { useQuery } from "@tanstack/react-query";
import { apiFetch, QUERY_KEYS } from "@/lib/query-client";
import type { DailyDashboardData, MonthlyDashboardData, BranchName } from "@/types";

export function useDailyDashboard(dateKey?: string) { const q = dateKey ? `?date=${dateKey}` : ""; return useQuery({ queryKey: QUERY_KEYS.dashboardDaily(dateKey), queryFn: () => apiFetch<DailyDashboardData>(`/api/dashboard/daily${q}`), refetchInterval: 120000 }); }
export function useMonthlyDashboard(monthKey?: string) { const q = monthKey ? `?month=${monthKey}` : ""; return useQuery({ queryKey: QUERY_KEYS.dashboardMonthly(monthKey), queryFn: () => apiFetch<MonthlyDashboardData>(`/api/dashboard/monthly${q}`), refetchInterval: 600000 }); }
export function useBranchDashboard(branch: BranchName) { return useQuery({ queryKey: QUERY_KEYS.dashboardBranch(branch), queryFn: () => apiFetch(`/api/dashboard/branch?branch=${encodeURIComponent(branch)}`), refetchInterval: 120000 }); }
