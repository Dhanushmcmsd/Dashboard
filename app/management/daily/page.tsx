"use client";
import { useQuery } from "@tanstack/react-query";
import { apiFetch, QUERY_KEYS } from "@/lib/query-client";
import type { DailyDashboardData } from "@/types";

export default function DailyPage() {
  const { data, isLoading } = useQuery({ queryKey: QUERY_KEYS.dashboardDaily(), queryFn: () => apiFetch<DailyDashboardData>("/api/dashboard/daily") });
  if (isLoading) return <div>Loading...</div>;
  if (!data) return <div>Failed</div>;
  return <div><h1 className="text-xl font-bold mb-4">Daily Dashboard - {data.dateKey}</h1><div className="grid grid-cols-2 gap-3"><div>Closing: {data.totals.closingBalance.toLocaleString("en-IN", { style: "currency", currency: "INR" })}</div><div>Collection: {data.totals.collection.toLocaleString("en-IN", { style: "currency", currency: "INR" })}</div></div></div>;
}
