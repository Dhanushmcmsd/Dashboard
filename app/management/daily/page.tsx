"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { apiFetch, QUERY_KEYS } from "@/lib/query-client";
import { getPusherClient } from "@/lib/pusher-client";
import { PUSHER_CHANNELS, PUSHER_EVENTS, DPD_BUCKETS, BRANCHES } from "@/lib/constants";
import type { DailyDashboardData, DpdBucketData } from "@/types";
import KPICard from "@/components/management/KPICard";
import BranchUploadStatus from "@/components/management/BranchUploadStatus";
import BranchComparisonChart from "@/components/management/BranchComparisonChart";
import DpdBucketChart from "@/components/management/DpdBucketChart";
import MissingBranchBanner from "@/components/shared/MissingBranchBanner";
import { formatINR } from "@/lib/utils";

export default function DailyPage() {
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.dashboardDaily(),
    queryFn: () => apiFetch<DailyDashboardData>("/api/dashboard/daily"),
    refetchInterval: 2 * 60 * 1000,
  });

  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe(PUSHER_CHANNELS.DASHBOARD);
    channel.bind(PUSHER_EVENTS.DASHBOARD_UPDATED, () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.dashboardDaily() });
    });
    return () => {
      channel.unbind_all();
      pusher.unsubscribe(PUSHER_CHANNELS.DASHBOARD);
    };
  }, [qc]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-text-muted text-sm animate-pulse">
        <span className="w-4 h-4 border-2 border-text-muted/30 border-t-text-muted rounded-full animate-spin" />
        Building daily dashboard...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-surface border border-danger/30 rounded-xl p-6 text-danger text-sm">
        Failed to load dashboard. Please refresh.
      </div>
    );
  }

  const combinedDpd: DpdBucketData[] = DPD_BUCKETS.map((bucket) => ({
    bucket,
    count: data.branches.reduce((s, b) => s + (b.dpdBuckets[bucket]?.count ?? 0), 0),
    amount: data.branches.reduce((s, b) => s + (b.dpdBuckets[bucket]?.amount ?? 0), 0),
  }));
  const uploadedCount = data.uploadedBranches.length;
  const totalCount = BRANCHES.length;

  return (
    <div>
      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-main">Daily Dashboard</h1>
          <p className="text-text-muted text-xs mt-0.5">
            {data.dateKey} · Last updated {new Date(data.lastUpdated).toLocaleTimeString("en-IN")}
          </p>
        </div>
        <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
          uploadedCount === totalCount ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
        }`}>
          {uploadedCount}/{totalCount} branches uploaded
        </span>
      </div>

      <MissingBranchBanner branches={data.missingBranches} />
      <BranchUploadStatus uploadedBranches={data.uploadedBranches} missingBranches={data.missingBranches} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard label="Total Closing Balance" value={data.totals.closingBalance} icon="💰" colorClass="text-primary" subtext={`across ${uploadedCount} branch${uploadedCount !== 1 ? "es" : ""}`} />
        <KPICard label="Total Disbursement" value={data.totals.disbursement} icon="📤" colorClass="text-success" />
        <KPICard label="Total Collection" value={data.totals.collection} icon="📥" colorClass="text-warning" />
        <KPICard label="Total NPA" value={data.totals.npa} icon="⚠️" colorClass="text-danger" />
      </div>

      {data.branches.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <BranchComparisonChart branches={data.branches} />
          <DpdBucketChart data={combinedDpd} />
        </div>
      )}

      {data.branches.length > 0 ? (
        <div className="bg-surface border border-border rounded-xl overflow-x-auto">
          <div className="px-5 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-text-main">Branch Breakdown</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr>
                {["Branch", "Closing Balance", "Disbursement", "Collection", "NPA", "Uploaded by", "Time"].map((h) => (
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
                  <td className="px-4 py-3 font-mono text-success whitespace-nowrap">{formatINR(b.disbursement)}</td>
                  <td className="px-4 py-3 font-mono text-warning whitespace-nowrap">{formatINR(b.collection)}</td>
                  <td className="px-4 py-3 font-mono text-danger whitespace-nowrap">{formatINR(b.npa)}</td>
                  <td className="px-4 py-3 text-text-muted text-xs">{b.uploadedBy}</td>
                  <td className="px-4 py-3 text-text-muted text-xs whitespace-nowrap">
                    {new Date(b.uploadedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl p-10 text-center">
          <span className="text-5xl block mb-3">📭</span>
          <p className="text-text-main font-semibold">No data uploaded yet today</p>
          <p className="text-text-muted text-sm mt-1">Dashboard will populate as branches upload their daily files.</p>
        </div>
      )}
    </div>
  );
}
