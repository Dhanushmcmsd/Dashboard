"use client";

import { BranchName } from "@/types";
import { useBranchDashboard } from "@/hooks/useDashboardData";
import { BRANCH_COLORS } from "@/lib/constants";
import KPICard from "./KPICard";
import DpdBucketChart from "./DpdBucketChart";
import { format } from "date-fns";
import { Clock, Loader2 } from "lucide-react";

interface Props {
  branch: BranchName;
}

export default function BranchDetailView({ branch }: Props) {
  const { data, isLoading, isError, refetch } = useBranchDashboard(branch);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-danger/10 border border-danger/20 rounded-xl p-6 text-center">
        <h3 className="text-danger font-medium mb-2">Failed to load data</h3>
        <button 
          onClick={() => refetch()}
          className="px-4 py-2 bg-surface border border-border rounded-lg text-sm hover:bg-elevated transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-surface border border-border rounded-xl p-12 text-center flex flex-col items-center">
        <Clock className="h-12 w-12 text-warning mb-4" />
        <h3 className="text-xl font-medium text-text-primary mb-2">No Data Yet</h3>
        <p className="text-text-muted max-w-md">
          {branch} has not uploaded any data today. Once uploaded, the dashboard will update automatically.
        </p>
      </div>
    );
  }

  const dpdArray = Object.keys(data.dpdBuckets).map(key => ({
    bucket: key as any,
    count: data.dpdBuckets[key as keyof typeof data.dpdBuckets].count,
    amount: data.dpdBuckets[key as keyof typeof data.dpdBuckets].amount,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-surface border border-border rounded-xl p-6">
        <div>
          <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            {branch}
            <span className="flex items-center text-xs font-medium bg-success/10 text-success px-2 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse mr-1.5" />
              Uploaded
            </span>
          </h2>
          <p className="text-sm text-text-muted mt-1">
            Uploaded by {data.uploadedBy} · File: {data.fileName}
          </p>
        </div>
        <div className="mt-4 md:mt-0 text-left md:text-right">
          <p className="text-xs text-text-muted uppercase tracking-wider">Last Updated</p>
          <p className="font-medium text-text-primary">
            {format(new Date(data.uploadedAt), "MMM d, yyyy h:mm a")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Closing Balance" value={data.closingBalance} colorClass="bg-blue-500" />
        <KPICard label="Disbursement" value={data.disbursement} colorClass="bg-green-500" />
        <KPICard label="Collection" value={data.collection} colorClass="bg-purple-500" />
        <KPICard label="NPA" value={data.npa} colorClass="bg-red-500" />
      </div>

      <div className="bg-surface border border-border rounded-xl p-6">
        <h3 className="text-lg font-medium text-text-primary mb-6">DPD Buckets</h3>
        <DpdBucketChart data={dpdArray} />
      </div>
    </div>
  );
}
