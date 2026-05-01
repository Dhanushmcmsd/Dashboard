"use client";

import { useState } from "react";
import { useDailyDashboard } from "@/hooks/useDashboardData";
import { Loader2, RefreshCcw, Calendar as CalendarIcon, RotateCcw } from "lucide-react";
import { format, parseISO } from "date-fns";
import MissingBranchBanner from "@/components/shared/MissingBranchBanner";
import BranchUploadStatus from "@/components/management/BranchUploadStatus";
import KPICard from "@/components/management/KPICard";
import BranchComparisonChart from "@/components/management/BranchComparisonChart";
import DpdBucketChart from "@/components/management/DpdBucketChart";
import { formatINRCompact } from "@/lib/utils";

function getTodayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export default function DailyDashboardPage() {
  const todayStr = getTodayStr();
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const isViewingPast = selectedDate !== todayStr;

  const { data, isLoading, isError, refetch } = useDailyDashboard(
    isViewingPast ? selectedDate : undefined
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-text-muted">Loading daily dashboard...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-danger/10 border border-danger/20 rounded-xl p-8 text-center max-w-lg mx-auto mt-12">
        <h3 className="text-danger font-medium text-lg mb-2">Failed to load dashboard</h3>
        <p className="text-danger/80 mb-6">There was an error fetching the latest data. Please try again.</p>
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

  type DpdKeys = "0" | "1-30" | "31-60" | "61-90" | "91-180" | "181+";
  const combinedDpd: Record<DpdKeys, { count: number; amount: number }> = {
    "0": { count: 0, amount: 0 },
    "1-30": { count: 0, amount: 0 },
    "31-60": { count: 0, amount: 0 },
    "61-90": { count: 0, amount: 0 },
    "91-180": { count: 0, amount: 0 },
    "181+": { count: 0, amount: 0 },
  };

  data.branches.forEach((b) => {
    Object.keys(b.dpdBuckets).forEach((bucket) => {
      const bKey = bucket as DpdKeys;
      const bData = b.dpdBuckets[bKey];
      if (bData) {
        combinedDpd[bKey].count += bData.count || 0;
        combinedDpd[bKey].amount += bData.amount || 0;
      }
    });
  });

  const dpdArray = Object.keys(combinedDpd).map((key) => ({
    bucket: key as any,
    count: combinedDpd[key as keyof typeof combinedDpd].count,
    amount: combinedDpd[key as keyof typeof combinedDpd].amount,
  }));

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between bg-surface border border-border rounded-xl p-6">
        <div>
          <h2 className="text-2xl font-bold text-text-primary flex items-center gap-3">
            Daily Combined View
            <span className="flex items-center text-xs font-medium bg-elevated text-text-primary border border-border px-3 py-1 rounded-full">
              <CalendarIcon className="w-3 h-3 mr-1.5 text-text-muted" />
              {data.dateKey}
            </span>
          </h2>
          <p className="text-sm text-text-muted mt-2">
            Aggregated data for {data.dateKey} based on uploaded branch reports.
          </p>
          {isViewingPast && (
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
              <CalendarIcon className="w-3 h-3" />
              Viewing: {format(parseISO(selectedDate), "MMMM d, yyyy")}
            </div>
          )}
        </div>

        <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end gap-3">
          {/* Date picker + Today button */}
          <div className="flex items-center gap-2">
            {isViewingPast && (
              <button
                onClick={() => setSelectedDate(todayStr)}
                title="Go to today"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Today
              </button>
            )}
            <input
              type="date"
              value={selectedDate}
              max={todayStr}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="bg-elevated border border-border text-text-primary rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 cursor-pointer"
            />
          </div>

          {/* Branch upload count */}
          <div className="flex items-center gap-3 md:justify-end">
            <span className="text-sm font-medium px-2.5 py-1 bg-surface border border-border rounded text-text-primary">
              {data.uploadedBranches.length} / 5
            </span>
            <span className="text-xs text-text-muted uppercase tracking-wider">Branches Uploaded</span>
          </div>
          <p className="text-xs text-text-muted">
            Last updated: {format(new Date(data.lastUpdated), "h:mm a")}
          </p>
        </div>
      </div>

      <MissingBranchBanner branches={data.missingBranches} />

      <BranchUploadStatus
        uploadedBranches={data.uploadedBranches}
        missingBranches={data.missingBranches}
      />

      {data.uploadedBranches.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-16 text-center">
          <CalendarIcon className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-medium text-text-primary mb-2">No Data Available</h3>
          <p className="text-text-muted max-w-md mx-auto">
            None of the branches have uploaded their data for {data.dateKey} yet.
            {!isViewingPast && " The dashboard will update automatically as soon as data arrives."}
          </p>
          {isViewingPast && (
            <button
              onClick={() => setSelectedDate(todayStr)}
              className="mt-6 px-5 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Back to Today
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard label="Total Closing Balance" value={data.totals.closingBalance} colorClass="bg-blue-500" />
            <KPICard label="Total Disbursement" value={data.totals.disbursement} colorClass="bg-green-500" />
            <KPICard label="Total Collection" value={data.totals.collection} colorClass="bg-purple-500" />
            <KPICard label="Total NPA" value={data.totals.npa} colorClass="bg-red-500" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-lg font-medium text-text-primary mb-6">Branch Comparison</h3>
              <BranchComparisonChart branches={data.branches} />
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-lg font-medium text-text-primary mb-6">Combined DPD Buckets</h3>
              <DpdBucketChart data={dpdArray} />
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="p-6 border-b border-border bg-elevated/50">
              <h3 className="text-lg font-medium text-text-primary">Branch Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-text-muted uppercase bg-elevated border-b border-border">
                  <tr>
                    <th className="px-6 py-4">Branch</th>
                    <th className="px-6 py-4 text-right">Closing Balance</th>
                    <th className="px-6 py-4 text-right">Disbursement</th>
                    <th className="px-6 py-4 text-right">Collection</th>
                    <th className="px-6 py-4 text-right">NPA</th>
                    <th className="px-6 py-4 text-right">Uploaded At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.branches.map((b) => (
                    <tr key={b.branch} className="hover:bg-elevated/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-text-primary">{b.branch}</td>
                      <td className="px-6 py-4 text-right">{formatINRCompact(b.closingBalance)}</td>
                      <td className="px-6 py-4 text-right">{formatINRCompact(b.disbursement)}</td>
                      <td className="px-6 py-4 text-right">{formatINRCompact(b.collection)}</td>
                      <td className="px-6 py-4 text-right text-danger">{formatINRCompact(b.npa)}</td>
                      <td className="px-6 py-4 text-right text-text-muted text-xs">
                        {format(new Date(b.uploadedAt), "h:mm a")}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-elevated font-semibold text-text-primary border-t-2 border-border/80">
                    <td className="px-6 py-4">Total</td>
                    <td className="px-6 py-4 text-right text-blue-400">{formatINRCompact(data.totals.closingBalance)}</td>
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
