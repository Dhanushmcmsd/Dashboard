"use client";
import { useQuery } from "@tanstack/react-query";
import { apiFetch, QUERY_KEYS } from "@/lib/query-client";
import type { MonthlyDashboardData } from "@/types";

export default function MonthlyPage() {
  const { data, isLoading } = useQuery({ queryKey: QUERY_KEYS.dashboardMonthly(), queryFn: () => apiFetch<MonthlyDashboardData>("/api/dashboard/monthly") });
  if (isLoading) return <div>Loading...</div>;
  if (!data) return <div>Failed</div>;
  return <div><h1 className="text-xl font-bold mb-4">Monthly Dashboard - {data.monthKey}</h1><div>Total: {data.totals.closingBalance.toLocaleString("en-IN", { style: "currency", currency: "INR" })}</div></div>;
}
