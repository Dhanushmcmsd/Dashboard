"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { CSSProperties } from "react";
import { apiFetch, QUERY_KEYS } from "@/lib/query-client";
import { getPusherClient } from "@/lib/pusher-client";
import { PUSHER_CHANNELS, PUSHER_EVENTS, BRANCH_COLORS, DPD_BUCKETS } from "@/lib/constants";
import type { BranchName, ParsedRow, DpdBucketData } from "@/types";
import KPICard from "./KPICard";
import DpdBucketChart from "./DpdBucketChart";

interface BranchUpload {
  branch: string;
  rawData: ParsedRow | null;
  uploadedAt: string;
  uploadedByName: string;
  fileName: string;
  dateKey: string;
}

const BRANCH_ICONS: Record<BranchName, string> = {
  "Supermarket": "🛒",
  "Gold Loan": "🥇",
  "ML Loan": "📊",
  "Vehicle Loan": "🚗",
  "Personal Loan": "👤",
};

type BranchVars = CSSProperties & {
  "--branch-bg": string;
  "--branch-border": string;
};

export default function BranchDetailView({ branch }: { branch: BranchName }) {
  const qc = useQueryClient();
  const color = BRANCH_COLORS[branch];
  const vars: BranchVars = {
    "--branch-bg": `${color}20`,
    "--branch-border": `${color}40`,
  };

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.dashboardBranch(branch),
    queryFn: () => apiFetch<BranchUpload | null>(`/api/dashboard/branch?branch=${encodeURIComponent(branch)}`),
    refetchInterval: 2 * 60 * 1000,
  });

  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe(PUSHER_CHANNELS.UPLOADS);
    channel.bind(PUSHER_EVENTS.UPLOAD_COMPLETE, (payload: { branch: string }) => {
      if (payload.branch === branch) {
        qc.invalidateQueries({ queryKey: QUERY_KEYS.dashboardBranch(branch) });
      }
    });
    return () => {
      channel.unbind_all();
      pusher.unsubscribe(PUSHER_CHANNELS.UPLOADS);
    };
  }, [qc, branch]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-text-muted text-sm animate-pulse">
        <span className="w-4 h-4 border-2 border-text-muted/30 border-t-text-muted rounded-full animate-spin" />
        Loading {branch} data...
      </div>
    );
  }

  if (!data || !data.rawData) {
    return (
      <div style={vars}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-[var(--branch-bg)] border border-[var(--branch-border)]">
            {BRANCH_ICONS[branch]}
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-main">{branch}</h1>
            <p className="text-text-muted text-xs">No data uploaded yet for today</p>
          </div>
        </div>
        <div className="bg-surface border border-warning/30 rounded-2xl p-8 text-center">
          <span className="text-4xl block mb-3">⏳</span>
          <p className="text-warning font-semibold">Awaiting upload</p>
          <p className="text-text-muted text-sm mt-1">The {branch} employee has not uploaded data for today yet.</p>
        </div>
      </div>
    );
  }

  const m = data.rawData;
  const dpd: DpdBucketData[] = DPD_BUCKETS.map((b) => ({
    bucket: b,
    count: m.dpdBuckets[b]?.count ?? 0,
    amount: m.dpdBuckets[b]?.amount ?? 0,
  }));

  return (
    <div style={vars}>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-[var(--branch-bg)] border border-[var(--branch-border)]">
            {BRANCH_ICONS[branch]}
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-main">{branch}</h1>
            <p className="text-text-muted text-xs mt-0.5">
              {data.fileName} · Uploaded by <span className="text-text-main">{data.uploadedByName}</span> ·{" "}
              {new Date(data.uploadedAt).toLocaleString("en-IN")}
            </p>
          </div>
        </div>
        <span className="bg-success/15 text-success text-xs font-medium px-3 py-1.5 rounded-full">Uploaded today</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard label="Closing Balance" value={m.closingBalance} icon="💰" colorClass="text-primary" />
        <KPICard label="Disbursement" value={m.disbursement} icon="📤" colorClass="text-success" />
        <KPICard label="Collection" value={m.collection} icon="📥" colorClass="text-warning" />
        <KPICard label="NPA" value={m.npa} icon="⚠️" colorClass="text-danger" />
      </div>

      <DpdBucketChart data={dpd} />
    </div>
  );
}
