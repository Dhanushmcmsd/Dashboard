"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch, QUERY_KEYS } from "@/lib/query-client";
import type { MonthlyDashboardData } from "@/types";
import KPICard from "@/components/management/KPICard";
import BranchComparisonChart from "@/components/management/BranchComparisonChart";
import { formatINR } from "@/lib/utils";

export default function MonthlyPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.dashboardMonthly(),
    queryFn: () => apiFetch<MonthlyDashboardData>("/api/dashboard/monthly"),
    refetchInterval: 10 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-text-muted text-sm animate-pulse">
        <span className="w-4 h-4 border-2 border-text-muted/30 border-t-text-muted rounded-full animate-spin" />
        Loading monthly data...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-surface border border-danger/30 rounded-xl p-6 text-danger text-sm">
        Failed to load monthly dashboard.
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-main">Monthly Dashboard</h1>
          <p className="text-text-muted text-xs mt-0.5">
            {data.monthKey} · Last updated {new Date(data.lastUpdated).toLocaleString("en-IN")}
          </p>
        </div>
        <span className="text-xs bg-primary/15 text-primary font-medium px-3 py-1.5 rounded-full">
          {data.branches.length} branches reporting
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard label="Closing Balance" value={data.totals.closingBalance} icon="💰" colorClass="text-primary" />
        <KPICard label="Disbursement" value={data.totals.disbursement} icon="📤" colorClass="text-success" />
        <KPICard label="Collection" value={data.totals.collection} icon="📥" colorClass="text-warning" />
        <KPICard label="NPA" value={data.totals.npa} icon="⚠️" colorClass="text-danger" />
      </div>

      {data.branches.length > 0 && (
        <div className="mb-6">
          <BranchComparisonChart branches={data.branches} />
        </div>
      )}

      {data.branches.length > 0 ? (
        <div className="bg-surface border border-border rounded-xl overflow-x-auto">
          <div className="px-5 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-text-main">Monthly Branch Performance</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr>
                {["Branch", "Closing Balance", "vs Last Month", "Disbursement", "Collection", "NPA", "Last upload"].map((h) => (
                  <th key={h} className="text-left text-text-muted text-xs uppercase tracking-wider font-medium px-4 py-3 bg-background/30 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.branches.map((b) => (
                <tr key={b.branch} className="border-t border-border/50 hover:bg-border/10 transition">
                  <td className="px-4 py-3 font-medium text-text-main whitespace-nowrap">{b.branch}</td>
                  <td className="px-4 py-3 font-mono text-primary whitespace-nowrap">{formatINR(b.closingBalance)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {b.growthPercent === null ? (
                      <span className="text-text-muted text-xs">No previous data</span>
                    ) : (
                      <span className={`text-xs font-semibold ${b.trend === "up" ? "text-success" : b.trend === "down" ? "text-danger" : "text-text-muted"}`}>
                        {b.trend === "up" ? "↑" : b.trend === "down" ? "↓" : "→"} {Math.abs(b.growthPercent).toFixed(2)}%
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-success whitespace-nowrap">{formatINR(b.disbursement)}</td>
                  <td className="px-4 py-3 font-mono text-warning whitespace-nowrap">{formatINR(b.collection)}</td>
                  <td className="px-4 py-3 font-mono text-danger whitespace-nowrap">{formatINR(b.npa)}</td>
                  <td className="px-4 py-3 text-text-muted text-xs whitespace-nowrap">
                    {new Date(b.uploadedAt).toLocaleDateString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl p-10 text-center">
          <span className="text-5xl block mb-3">📭</span>
          <p className="text-text-main font-semibold">No data for this month yet</p>
        </div>
      )}
    </div>
  );
}
