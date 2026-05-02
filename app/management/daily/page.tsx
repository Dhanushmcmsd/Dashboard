"use client";

import { useState } from "react";
import { useDailyDashboard } from "@/hooks/useDashboardData";
import {
  Loader2, RefreshCcw, Calendar as CalendarIcon, RotateCcw, Download,
  Landmark, TrendingUp, Banknote, AlertTriangle,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import MissingBranchBanner from "@/components/shared/MissingBranchBanner";
import BranchUploadStatus from "@/components/management/BranchUploadStatus";
import KPICard from "@/components/management/KPICard";
import BranchComparisonChart from "@/components/management/BranchComparisonChart";
import DpdBucketChart from "@/components/management/DpdBucketChart";
import CollectionEfficiencyChart from "@/components/management/CollectionEfficiencyChart";
import GnpaGauge from "@/components/management/GnpaGauge";
import DisbursementTrendChart from "@/components/management/DisbursementTrendChart";
import MetricDrawer from "@/components/management/MetricDrawer";
import { formatINRCompact } from "@/lib/utils";
import { DailyDashboardData } from "@/types";

function getTodayStr(): string {
  return new Date().toISOString().split("T")[0];
}

// ── Inline drawer content components ──────────────────────────────────────────

function AumDrawerContent({ data }: { data: DailyDashboardData }) {
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 pr-4 text-xs text-text-muted uppercase tracking-wider">Branch</th>
              <th className="text-right py-2 pr-4 text-xs text-text-muted uppercase tracking-wider">AUM</th>
              <th className="text-right py-2 text-xs text-text-muted uppercase tracking-wider">% Share</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.branches.map((b) => (
              <tr key={b.branch} className="hover:bg-elevated/50">
                <td className="py-3 pr-4 font-medium text-text-primary">{b.branch}</td>
                <td className="py-3 pr-4 text-right tabular-nums">{formatINRCompact(b.closingBalance)}</td>
                <td className="py-3 text-right text-text-muted tabular-nums">
                  {data.totals.closingBalance > 0
                    ? `${((b.closingBalance / data.totals.closingBalance) * 100).toFixed(1)}%`
                    : "\u2014"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NpaDrawerContent({
  gnpaPct, gnpaAmount, overdueAmount, totalAum,
}: {
  gnpaPct: number; gnpaAmount: number; overdueAmount: number; totalAum: number;
}) {
  return (
    <div className="space-y-4">
      <GnpaGauge gnpaPct={gnpaPct} gnpaAmount={gnpaAmount} totalAum={totalAum} />
      <div className="bg-elevated rounded-lg p-4 space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-text-muted">GNPA Amount (DPD &gt;90)</span>
          <span className="text-danger font-semibold tabular-nums">{formatINRCompact(gnpaAmount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted">Total Overdue (DPD &gt;0)</span>
          <span className="text-warning font-semibold tabular-nums">{formatINRCompact(overdueAmount)}</span>
        </div>
        <div className="flex justify-between border-t border-border pt-3">
          <span className="text-text-muted">GNPA % of Total AUM</span>
          <span className="text-text-primary font-bold tabular-nums">{gnpaPct.toFixed(2)}%</span>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DailyDashboardPage() {
  const todayStr = getTodayStr();
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [drawer, setDrawer] = useState<{
    open: boolean;
    title: string;
    subtitle?: string;
    content: React.ReactNode;
  }>({ open: false, title: "", content: null });

  const isViewingPast = selectedDate !== todayStr;

  const { data, isLoading, isError, refetch } = useDailyDashboard(
    isViewingPast ? selectedDate : undefined
  );

  const openDrawer = (title: string, subtitle: string, content: React.ReactNode) =>
    setDrawer({ open: true, title, subtitle, content });
  const closeDrawer = () => setDrawer((d) => ({ ...d, open: false }));

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

  // ── DPD aggregation ──────────────────────────────────────────────────────────
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

  // ── Derived metrics ──────────────────────────────────────────────────────────
  const totalAccounts = data.branches.reduce((s, b) => s + (b.totalAccounts ?? 0), 0);
  const gnpaAmount = data.branches.reduce((s, b) => s + (b.gnpaAmount ?? b.npa ?? 0), 0);
  const gnpaPct = data.totals.closingBalance > 0
    ? (gnpaAmount / data.totals.closingBalance) * 100
    : 0;
  const overdueAmount = data.branches.reduce((s, b) => s + (b.overdueAmount ?? 0), 0);
  const collEff =
    data.branches.reduce((s, b) => s + (b.collectionEfficiency ?? 0), 0) /
    (data.branches.length || 1);
  const ftd = data.branches.reduce((s, b) => s + (b.ftdDisbursement ?? 0), 0);
  const mtd = data.branches.reduce((s, b) => s + (b.mtdDisbursement ?? b.disbursement ?? 0), 0);
  const ytd = data.branches.reduce((s, b) => s + (b.ytdDisbursement ?? 0), 0);

  // collectionHistory: empty array until a trend API is wired; chart handles this gracefully
  const collectionHistory: { date: string; efficiency: number; overdueBalance: number }[] = [];

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
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.open(`/api/export/daily?date=${selectedDate}`)}
              className="flex items-center gap-1.5 bg-elevated hover:bg-border border border-border text-text-primary text-sm px-3 py-1.5 rounded-lg transition-colors"
              title="Export to Excel"
            >
              <Download className="w-4 h-4" />
              Export Excel
            </button>
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
          {/* ── KPI Grid ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <KPICard
              label="Total AUM"
              value={data.totals.closingBalance}
              colorClass="bg-primary"
              icon={<Landmark size={15} />}
              subtext={totalAccounts > 0 ? `${totalAccounts.toLocaleString()} accounts` : undefined}
              onClick={() =>
                openDrawer("Total AUM Breakdown", `As of ${data.dateKey}`, <AumDrawerContent data={data} />)
              }
            />
            <KPICard
              label="Total Disbursement"
              value={data.totals.disbursement}
              colorClass="bg-success"
              icon={<TrendingUp size={15} />}
              onClick={() =>
                openDrawer(
                  "Disbursement \u2014 FTD / MTD / YTD",
                  `As of ${data.dateKey}`,
                  <DisbursementTrendChart ftd={ftd} mtd={mtd} ytd={ytd} />
                )
              }
            />
            <KPICard
              label="Total Collection"
              value={data.totals.collection}
              colorClass="bg-purple-500"
              icon={<Banknote size={15} />}
              subtext={collEff > 0 ? `${collEff.toFixed(1)}% efficiency` : undefined}
            />
            <KPICard
              label="Total NPA"
              value={data.totals.npa}
              colorClass="bg-danger"
              icon={<AlertTriangle size={15} />}
              subtext={`${gnpaPct.toFixed(2)}% of AUM`}
              onClick={() =>
                openDrawer(
                  "NPA & Overdue Detail",
                  `GNPA: ${gnpaPct.toFixed(2)}%`,
                  <NpaDrawerContent
                    gnpaPct={gnpaPct}
                    gnpaAmount={gnpaAmount}
                    overdueAmount={overdueAmount}
                    totalAum={data.totals.closingBalance}
                  />
                )
              }
            />
          </div>

          {/* ── Charts Row 1 ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-5">Branch Performance</h3>
              <BranchComparisonChart branches={data.branches} />
            </div>
            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-5">DPD Bucket Distribution</h3>
              <DpdBucketChart data={dpdArray} />
            </div>
          </div>

          {/* ── Charts Row 2 ── */}
          {(collectionHistory.length > 0 || ftd > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-6">
                <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-5">Collection Efficiency Trend</h3>
                <CollectionEfficiencyChart data={collectionHistory} />
              </div>
              <GnpaGauge gnpaPct={gnpaPct} gnpaAmount={gnpaAmount} totalAum={data.totals.closingBalance} />
            </div>
          )}

          {/* ── Branch Breakdown Table ── */}
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
                    <td className="px-6 py-4 text-right text-text-muted text-xs">\u2014</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── MetricDrawer (portal, always mounted) ── */}
      <MetricDrawer
        isOpen={drawer.open}
        title={drawer.title}
        subtitle={drawer.subtitle}
        onClose={closeDrawer}
      >
        {drawer.content}
      </MetricDrawer>
    </div>
  );
}
