"use client";

import { useMonthlyDashboard } from "@/hooks/useDashboardData";
import { Loader2, RefreshCcw, CalendarDays, TrendingUp, TrendingDown, Minus, Download } from "lucide-react";
import { format } from "date-fns";
import KPICard from "@/components/management/KPICard";
import BranchComparisonChart from "@/components/management/BranchComparisonChart";
import { formatINRCompact } from "@/lib/utils";

export default function MonthlyDashboardPage() {
  const { data, isLoading, isError, refetch } = useMonthlyDashboard();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-text-muted">Loading monthly dashboard...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-danger/10 border border-danger/20 rounded-xl p-8 text-center max-w-lg mx-auto mt-12">
        <h3 className="text-danger font-medium text-lg mb-2">Failed to load dashboard</h3>
        <p className="text-danger/80 mb-6">There was an error fetching the monthly data.</p>
        <button
          onClick={() => refetch()}
          className="px-6 py-2 bg-surface border border-border rounded-lg font-medium hover:bg-elevated transition-colors inline-flex items-center"
        >
          <RefreshCcw className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between bg-surface border border-border rounded-xl p-6">
        <div>
          <h2 className="text-2xl font-bold text-text-primary flex items-center gap-3">
            Monthly Overview
            <span className="flex items-center text-xs font-medium bg-elevated text-text-primary border border-border px-3 py-1 rounded-full">
              <CalendarDays className="w-3 h-3 mr-1.5 text-text-muted" />
              {data.monthKey}
            </span>
          </h2>
          <p className="text-sm text-text-muted mt-2">
            Aggregated monthly totals and month-over-month growth.
          </p>
        </div>

        <div className="mt-4 md:mt-0 text-left md:text-right flex flex-col items-start md:items-end gap-3">
          {/* Export button */}
          <button
            onClick={() => window.open(`/api/export/monthly?month=${data.monthKey}`)}
            className="flex items-center gap-1.5 bg-elevated hover:bg-border border border-border text-text-primary text-sm px-3 py-1.5 rounded-lg transition-colors"
            title="Export to Excel"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>

          <div className="flex items-center gap-3 md:justify-end">
            <span className="text-sm font-medium px-2.5 py-1 bg-surface border border-border rounded text-text-primary">
              {data.branches.length}
            </span>
            <span className="text-xs text-text-muted uppercase tracking-wider">Active Branches</span>
          </div>
          <p className="text-xs text-text-muted">
            Last calculated: {format(new Date(data.lastUpdated), "MMM d, h:mm a")}
          </p>
        </div>
      </div>

      {data.branches.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-16 text-center">
          <CalendarDays className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-medium text-text-primary mb-2">No Monthly Data</h3>
          <p className="text-text-muted max-w-md mx-auto">
            No branch data has been uploaded for {data.monthKey} yet.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard label="Monthly Closing Balance" value={data.totals.closingBalance} colorClass="bg-blue-500" />
            <KPICard label="Monthly Disbursement" value={data.totals.disbursement} colorClass="bg-green-500" />
            <KPICard label="Monthly Collection" value={data.totals.collection} colorClass="bg-purple-500" />
            <KPICard label="Monthly NPA" value={data.totals.npa} colorClass="bg-red-500" />
          </div>

          <div className="bg-surface border border-border rounded-xl p-6">
            <h3 className="text-lg font-medium text-text-primary mb-6">Branch Comparison (Monthly)</h3>
            <div className="h-[400px]">
              <BranchComparisonChart branches={data.branches} />
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="p-6 border-b border-border bg-elevated/50">
              <h3 className="text-lg font-medium text-text-primary">Branch Monthly Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-text-muted uppercase bg-elevated border-b border-border">
                  <tr>
                    <th className="px-6 py-4">Branch</th>
                    <th className="px-6 py-4 text-right">Closing Balance</th>
                    <th className="px-6 py-4 text-center">vs Last Month</th>
                    <th className="px-6 py-4 text-right">Disbursement</th>
                    <th className="px-6 py-4 text-right">Collection</th>
                    <th className="px-6 py-4 text-right">NPA</th>
                    <th className="px-6 py-4 text-right">Last Upload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.branches.map((b) => (
                    <tr key={b.branch} className="hover:bg-elevated/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-text-primary">{b.branch}</td>
                      <td className="px-6 py-4 text-right">{formatINRCompact(b.closingBalance)}</td>
                      <td className="px-6 py-4 text-center">
                        {b.growthPercent !== null ? (
                          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                            b.trend === "up"      ? "text-success bg-success/10" :
                            b.trend === "down"    ? "text-danger bg-danger/10" :
                            "text-text-muted bg-surface"
                          }`}>
                            {b.trend === "up"      && <TrendingUp   className="w-3 h-3" />}
                            {b.trend === "down"    && <TrendingDown  className="w-3 h-3" />}
                            {b.trend === "neutral" && <Minus         className="w-3 h-3" />}
                            {Math.abs(b.growthPercent)}%
                          </div>
                        ) : (
                          <span className="text-text-muted text-xs">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">{formatINRCompact(b.disbursement)}</td>
                      <td className="px-6 py-4 text-right">{formatINRCompact(b.collection)}</td>
                      <td className="px-6 py-4 text-right text-danger">{formatINRCompact(b.npa)}</td>
                      <td className="px-6 py-4 text-right text-text-muted text-xs">
                        {format(new Date(b.uploadedAt), "MMM d")}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-elevated font-semibold text-text-primary border-t-2 border-border/80">
                    <td className="px-6 py-4">Total</td>
                    <td className="px-6 py-4 text-right text-blue-400">{formatINRCompact(data.totals.closingBalance)}</td>
                    <td className="px-6 py-4 text-center text-text-muted">—</td>
                    <td className="px-6 py-4 text-right text-green-400">{formatINRCompact(data.totals.disbursement)}</td>
                    <td className="px-6 py-4 text-right text-purple-400">{formatINRCompact(data.totals.collection)}</td>
                    <td className="px-6 py-4 text-right text-danger">{formatINRCompact(data.totals.npa)}</td>
                    <td className="px-6 py-4 text-right text-text-muted text-xs">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
