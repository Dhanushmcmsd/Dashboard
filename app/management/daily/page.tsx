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
import BranchComparisonChart from "@/components/management/BranchComparisonChart";
import DpdBucketChart from "@/components/management/DpdBucketChart";
import CollectionEfficiencyChart from "@/components/management/CollectionEfficiencyChart";
import GnpaGauge from "@/components/management/GnpaGauge";
import DisbursementTrendChart from "@/components/management/DisbursementTrendChart";
import PortfolioMixChart from "@/components/management/PortfolioMixChart";
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
            <tr className="border-b border-[#c8e6c0]">
              <th className="text-left py-2 pr-4 text-xs text-[#4a7c5f] uppercase tracking-wider">Branch</th>
              <th className="text-right py-2 pr-4 text-xs text-[#4a7c5f] uppercase tracking-wider">AUM</th>
              <th className="text-right py-2 text-xs text-[#4a7c5f] uppercase tracking-wider">% Share</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#c8e6c0]">
            {data.branches.map((b) => (
              <tr key={b.branch} className="hover:bg-[#f0faf4]">
                <td className="py-3 pr-4 font-medium text-[#064734]">{b.branch}</td>
                <td className="py-3 pr-4 text-right tabular-nums">{formatINRCompact(b.closingBalance)}</td>
                <td className="py-3 text-right text-[#4a7c5f] tabular-nums">
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
      <div className="bg-white border border-[#c8e6c0] rounded-2xl p-4 space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-[#4a7c5f]">GNPA Amount (DPD &gt;90)</span>
          <span className="text-[#991b1b] font-semibold tabular-nums">{formatINRCompact(gnpaAmount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#4a7c5f]">Total Overdue (DPD &gt;0)</span>
          <span className="text-[#b45309] font-semibold tabular-nums">{formatINRCompact(overdueAmount)}</span>
        </div>
        <div className="flex justify-between border-t border-[#c8e6c0] pt-3">
          <span className="text-[#4a7c5f]">GNPA % of Total AUM</span>
          <span className="text-[#064734] font-bold tabular-nums">{gnpaPct.toFixed(2)}%</span>
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
        <Loader2 className="h-8 w-8 animate-spin text-[#064734]" />
        <p className="text-[#4a7c5f]">Loading daily dashboard...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center max-w-lg mx-auto mt-12">
        <h3 className="text-[#991b1b] font-medium text-lg mb-2">Failed to load dashboard</h3>
        <p className="text-red-600/80 mb-6">There was an error fetching the latest data. Please try again.</p>
        <button
          onClick={() => refetch()}
          className="px-6 py-2 bg-white border border-[#c8e6c0] rounded-xl font-medium hover:border-[#064734] transition-colors inline-flex items-center"
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

  // AUM growth placeholder — wire to real trend API when available
  const aumGrowth = 0;

  // collectionHistory: empty array until a trend API is wired
  const collectionHistory: { date: string; efficiency: number; overdueBalance: number }[] = [];

  // Portfolio mix data for pie chart
  const portfolioData = data.branches.map((b) => ({
    name: b.branch,
    value: b.closingBalance,
  }));

  return (
    <div className="space-y-8">

      {/* ── Hero Stats Bento Grid (staggered fade-up entrance) ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">

        {/* Large AUM tile — spans 2 cols, delay-1 */}
        <div
          className="col-span-2 bg-[#064734] text-white rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer animate-fade-up-delay-1"
          onClick={() =>
            openDrawer("Total AUM Breakdown", `As of ${data.dateKey}`, <AumDrawerContent data={data} />)
          }
        >
          <div className="flex items-center justify-between mb-1">
            <p className="text-[#a8d5b5] text-xs uppercase tracking-widest font-medium">Total AUM</p>
            <Landmark className="w-4 h-4 text-[#a8d5b5]" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mt-2 tabular-nums animate-count-up">
            ₹{formatINRCompact(data.totals.closingBalance)}
          </h1>
          <div className="flex items-center gap-3 mt-4">
            {aumGrowth !== 0 && (
              <span className="bg-[#a8d5b5] text-[#064734] px-3 py-1 rounded-full text-xs font-semibold">
                {aumGrowth > 0 ? `+${aumGrowth}%` : `${aumGrowth}%`} {aumGrowth > 0 ? "↑" : "↓"}
              </span>
            )}
            {totalAccounts > 0 && (
              <span className="text-[#a8d5b5] text-xs">
                {totalAccounts.toLocaleString()} accounts
              </span>
            )}
            <span className="text-[#a8d5b5] text-xs ml-auto flex items-center gap-1">
              <CalendarIcon className="w-3 h-3" />
              {data.dateKey}
            </span>
          </div>
        </div>

        {/* Disbursement tile — delay-2 */}
        <div
          className="bg-white border border-[#c8e6c0] rounded-3xl p-6 hover:border-[#064734] transition-all duration-300 hover:-translate-y-1 cursor-pointer animate-fade-up-delay-2"
          onClick={() =>
            openDrawer(
              "Disbursement \u2014 FTD / MTD / YTD",
              `As of ${data.dateKey}`,
              <DisbursementTrendChart ftd={ftd} mtd={mtd} ytd={ytd} />
            )
          }
        >
          <div className="flex items-center justify-between mb-1">
            <p className="text-[#4a7c5f] text-xs uppercase tracking-wider font-medium">Disbursement</p>
            <TrendingUp className="w-4 h-4 text-[#4a7c5f]" />
          </div>
          <p className="text-2xl font-bold text-[#064734] mt-2 tabular-nums animate-count-up">
            ₹{formatINRCompact(data.totals.disbursement)}
          </p>
          <p className="text-[#4a7c5f] text-xs mt-2">MTD disbursement</p>
        </div>

        {/* Collection tile — delay-3 */}
        <div className="bg-white border border-[#c8e6c0] rounded-3xl p-6 hover:border-[#064734] transition-all duration-300 hover:-translate-y-1 animate-fade-up-delay-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[#4a7c5f] text-xs uppercase tracking-wider font-medium">Collection</p>
            <Banknote className="w-4 h-4 text-[#4a7c5f]" />
          </div>
          <p className="text-2xl font-bold text-[#064734] mt-2 tabular-nums animate-count-up">
            ₹{formatINRCompact(data.totals.collection)}
          </p>
          {collEff > 0 && (
            <p className="text-[#4a7c5f] text-xs mt-2">{collEff.toFixed(1)}% efficiency</p>
          )}
        </div>

        {/* NPA tile — delay-4 */}
        <div
          className="col-span-2 bg-white border border-[#c8e6c0] rounded-3xl p-6 hover:border-[#064734] transition-all duration-300 hover:-translate-y-1 cursor-pointer animate-fade-up-delay-4"
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
        >
          <div className="flex items-center justify-between mb-1">
            <p className="text-[#4a7c5f] text-xs uppercase tracking-wider font-medium">NPA</p>
            <AlertTriangle className="w-4 h-4 text-[#991b1b]" />
          </div>
          <p className="text-2xl font-bold text-[#991b1b] mt-2 tabular-nums animate-count-up">
            ₹{formatINRCompact(data.totals.npa)}
          </p>
          <p className="text-[#4a7c5f] text-xs mt-2">{gnpaPct.toFixed(2)}% of AUM</p>
        </div>

        {/* Date / controls tile */}
        <div className="col-span-2 bg-white border border-[#c8e6c0] rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-up-delay-4">
          <div>
            <p className="text-[#4a7c5f] text-xs uppercase tracking-wider font-medium mb-1">Viewing Period</p>
            {isViewingPast ? (
              <p className="text-[#064734] font-semibold">{format(parseISO(selectedDate), "MMMM d, yyyy")}</p>
            ) : (
              <p className="text-[#064734] font-semibold">Today · {data.dateKey}</p>
            )}
            <p className="text-[#4a7c5f] text-xs mt-1">Updated {format(new Date(data.lastUpdated), "h:mm a")}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {isViewingPast && (
              <button
                onClick={() => setSelectedDate(todayStr)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#064734] text-white rounded-full hover:bg-[#0a7c5c] transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Today
              </button>
            )}
            <button
              onClick={() => window.open(`/api/export/daily?date=${selectedDate}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-[#c8e6c0] text-[#064734] rounded-full hover:border-[#064734] transition-colors"
            >
              <Download className="w-3 h-3" />
              Export
            </button>
            <input
              type="date"
              value={selectedDate}
              max={todayStr}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="bg-white border border-[#c8e6c0] text-[#064734] rounded-full px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#064734]/20 cursor-pointer"
            />
          </div>
        </div>
      </div>

      <MissingBranchBanner branches={data.missingBranches} />

      {/* ── Branch Upload Status Strip ── */}
      <BranchUploadStatus
        uploadedBranches={data.uploadedBranches}
        missingBranches={data.missingBranches}
      />

      {data.uploadedBranches.length === 0 ? (
        <div className="bg-white border border-[#c8e6c0] rounded-3xl p-16 text-center">
          <CalendarIcon className="w-16 h-16 text-[#4a7c5f] mx-auto mb-4 opacity-40" />
          <h3 className="text-xl font-medium text-[#064734] mb-2">No Data Available</h3>
          <p className="text-[#4a7c5f] max-w-md mx-auto">
            None of the branches have uploaded their data for {data.dateKey} yet.
            {!isViewingPast && " The dashboard will update automatically as soon as data arrives."}
          </p>
          {isViewingPast && (
            <button
              onClick={() => setSelectedDate(todayStr)}
              className="mt-6 px-5 py-2 bg-[#064734] hover:bg-[#0a7c5c] text-white rounded-full text-sm font-medium transition-colors inline-flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Back to Today
            </button>
          )}
        </div>
      ) : (
        <>
          {/* ── Charts Bento Grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Branch Comparison — 2 cols */}
            <div className="lg:col-span-2 bg-white border border-[#c8e6c0] rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 animate-fade-up-delay-1">
              <h3 className="text-xs font-semibold text-[#4a7c5f] uppercase tracking-wider mb-5">Branch Performance</h3>
              <BranchComparisonChart branches={data.branches} />
            </div>

            {/* DPD Buckets */}
            <div className="bg-white border border-[#c8e6c0] rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 animate-fade-up-delay-2">
              <h3 className="text-xs font-semibold text-[#4a7c5f] uppercase tracking-wider mb-5">DPD Bucket Distribution</h3>
              <DpdBucketChart data={dpdArray} />
            </div>

            {/* Portfolio Mix Pie */}
            <div className="bg-white border border-[#c8e6c0] rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 animate-fade-up-delay-3">
              <h3 className="text-xs font-semibold text-[#4a7c5f] uppercase tracking-wider mb-5">Portfolio Mix</h3>
              <PortfolioMixChart data={portfolioData} />
            </div>

            {/* Collection Efficiency — 2 cols */}
            {collectionHistory.length > 0 ? (
              <div className="lg:col-span-2 bg-white border border-[#c8e6c0] rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 animate-fade-up-delay-4">
                <h3 className="text-xs font-semibold text-[#4a7c5f] uppercase tracking-wider mb-5">Collection Efficiency Trend</h3>
                <CollectionEfficiencyChart data={collectionHistory} />
              </div>
            ) : (
              <div className="lg:col-span-2 bg-white border border-[#c8e6c0] rounded-3xl p-6 shadow-sm flex items-center justify-center animate-fade-up-delay-4">
                <p className="text-[#4a7c5f] text-sm">Collection trend data will appear here once history is available.</p>
              </div>
            )}
          </div>

          {/* ── Branch Breakdown Table ── */}
          <div className="bg-white border border-[#c8e6c0] rounded-3xl overflow-hidden shadow-sm animate-fade-up-delay-4">
            <div className="p-6 border-b border-[#c8e6c0]">
              <h3 className="text-base font-semibold text-[#064734]">Branch Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-[#4a7c5f] uppercase bg-[#f0faf4] border-b border-[#c8e6c0]">
                  <tr>
                    <th className="px-6 py-4">Branch</th>
                    <th className="px-6 py-4 text-right">Closing Balance</th>
                    <th className="px-6 py-4 text-right">Disbursement</th>
                    <th className="px-6 py-4 text-right">Collection</th>
                    <th className="px-6 py-4 text-right">NPA</th>
                    <th className="px-6 py-4 text-right">Uploaded At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c8e6c0]">
                  {data.branches.map((b) => (
                    <tr key={b.branch} className="hover:bg-[#f0faf4] transition-colors">
                      <td className="px-6 py-4 font-medium text-[#064734]">{b.branch}</td>
                      <td className="px-6 py-4 text-right tabular-nums">{formatINRCompact(b.closingBalance)}</td>
                      <td className="px-6 py-4 text-right tabular-nums">{formatINRCompact(b.disbursement)}</td>
                      <td className="px-6 py-4 text-right tabular-nums">{formatINRCompact(b.collection)}</td>
                      <td className="px-6 py-4 text-right text-[#991b1b] tabular-nums">{formatINRCompact(b.npa)}</td>
                      <td className="px-6 py-4 text-right text-[#4a7c5f] text-xs">
                        {format(new Date(b.uploadedAt), "h:mm a")}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-[#f0faf4] font-semibold text-[#064734] border-t-2 border-[#c8e6c0]">
                    <td className="px-6 py-4">Total</td>
                    <td className="px-6 py-4 text-right text-[#064734] tabular-nums">{formatINRCompact(data.totals.closingBalance)}</td>
                    <td className="px-6 py-4 text-right text-[#0a7c5c] tabular-nums">{formatINRCompact(data.totals.disbursement)}</td>
                    <td className="px-6 py-4 text-right text-[#4aaa6f] tabular-nums">{formatINRCompact(data.totals.collection)}</td>
                    <td className="px-6 py-4 text-right text-[#991b1b] tabular-nums">{formatINRCompact(data.totals.npa)}</td>
                    <td className="px-6 py-4 text-right text-[#4a7c5f] text-xs">\u2014</td>
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
