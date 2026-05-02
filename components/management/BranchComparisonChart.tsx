"use client";
import { useState } from "react";
import { BranchDailyMetric } from "@/types";
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
  LabelList,
  ReferenceArea,
  TooltipProps,
} from "recharts";
import { formatINRCompact } from "@/lib/utils";

interface Props {
  branches: BranchDailyMetric[];
}

type ViewMode = "aum" | "risk" | "efficiency";

const BRANCH_COLORS: Record<string, string> = {
  Supermarket: "#2563EB",
  "Gold Loan": "#D97706",
  "ML Loan": "#16A34A",
  "Vehicle Loan": "#DC2626",
  "Personal Loan": "#7C3AED",
};

function getBranchColor(fullName: string): string {
  return BRANCH_COLORS[fullName] ?? "#64748B";
}

type ChartEntry = {
  name: string;
  fullName: string;
  Closing: number;
  MTDDisbursement: number;
  Collection: number;
  NPA: number;
  CollectionEfficiency: number | null;
  GNPAPct: number | null;
};

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      style={{
        backgroundColor: "#18181F",
        border: "1px solid #2A2A35",
        borderRadius: "8px",
        fontSize: "12px",
        padding: "10px 14px",
        minWidth: "160px",
      }}
    >
      <p style={{ color: "#E2E8F0", marginBottom: "6px", fontWeight: 600 }}>{label}</p>
      {payload.map((entry) => {
        const isPercent =
          entry.name === "CollectionEfficiency" || entry.name === "GNPAPct";
        const formatted = isPercent
          ? `${(entry.value as number).toFixed(1)}%`
          : formatINRCompact(entry.value as number);
        return (
          <div key={entry.name} style={{ display: "flex", justifyContent: "space-between", gap: "16px", color: entry.color }}>
            <span style={{ color: "#94A3B8" }}>
              {entry.name === "CollectionEfficiency"
                ? "Coll. Efficiency"
                : entry.name === "GNPAPct"
                ? "GNPA %"
                : entry.name === "MTDDisbursement"
                ? "MTD Disb."
                : entry.name}
            </span>
            <span style={{ fontWeight: 600, color: entry.color }}>{formatted}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function BranchComparisonChart({ branches }: Props) {
  const [view, setView] = useState<ViewMode>("aum");

  const data: ChartEntry[] = branches.map((b) => ({
    name: b.branch.replace(" Loan", "").replace("Supermarket", "SM"),
    fullName: b.branch,
    Closing: b.closingBalance,
    MTDDisbursement: b.mtdDisbursement ?? b.disbursement,
    Collection: b.collection,
    NPA: b.npa,
    CollectionEfficiency: b.collectionEfficiency ?? null,
    GNPAPct: b.gnpaPct ?? null,
  }));

  const VIEWS: { key: ViewMode; label: string }[] = [
    { key: "aum", label: "AUM View" },
    { key: "risk", label: "Risk View" },
    { key: "efficiency", label: "Efficiency View" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 bg-elevated border border-border rounded-lg p-1 w-fit">
        {VIEWS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setView(key)}
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
              view === key
                ? "bg-primary text-white shadow-sm"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="h-[340px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            barCategoryGap="30%"
            margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="rgba(255,255,255,0.06)"
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748B", fontSize: 12 }}
              dy={10}
            />

            {view === "efficiency" ? (
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748B", fontSize: 11 }}
                tickFormatter={(v: number) => `${v.toFixed(0)}%`}
                domain={[0, 120]}
              />
            ) : (
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748B", fontSize: 11 }}
                tickFormatter={(v: number) => formatINRCompact(v)}
              />
            )}

            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            <Legend wrapperStyle={{ paddingTop: "16px", fontSize: "12px" }} />

            {view === "aum" && (
              <>
                <Bar
                  dataKey="Closing"
                  name="Closing"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                  isAnimationActive={true}
                  animationDuration={600}
                  animationEasing="ease-out"
                >
                  {data.map((entry) => (
                    <Cell key={entry.fullName} fill={getBranchColor(entry.fullName)} />
                  ))}
                </Bar>
                <Bar
                  dataKey="MTDDisbursement"
                  name="MTDDisbursement"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                  fill="#16A34A"
                  isAnimationActive={true}
                  animationDuration={600}
                  animationEasing="ease-out"
                />
              </>
            )}

            {view === "risk" && (
              <>
                <ReferenceArea
                  y1={0}
                  y2={undefined}
                  fill="#DC262610"
                  ifOverflow="extendDomain"
                />
                <Bar
                  dataKey="Collection"
                  name="Collection"
                  fill="#7C3AED"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                  isAnimationActive={true}
                  animationDuration={600}
                  animationEasing="ease-out"
                />
                <Bar
                  dataKey="NPA"
                  name="NPA"
                  fill="#DC2626"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                  isAnimationActive={true}
                  animationDuration={600}
                  animationEasing="ease-out"
                />
              </>
            )}

            {view === "efficiency" && (
              <>
                <Bar
                  dataKey="CollectionEfficiency"
                  name="CollectionEfficiency"
                  fill="#2563EB"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                  isAnimationActive={true}
                  animationDuration={600}
                  animationEasing="ease-out"
                >
                  <LabelList
                    dataKey="CollectionEfficiency"
                    position="top"
                    formatter={(v: number) => `${v.toFixed(1)}%`}
                    style={{ fill: "#94A3B8", fontSize: 10 }}
                  />
                </Bar>
                <Bar
                  dataKey="GNPAPct"
                  name="GNPAPct"
                  fill="#DC2626"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                  isAnimationActive={true}
                  animationDuration={600}
                  animationEasing="ease-out"
                >
                  <LabelList
                    dataKey="GNPAPct"
                    position="top"
                    formatter={(v: number) => `${v.toFixed(1)}%`}
                    style={{ fill: "#94A3B8", fontSize: 10 }}
                  />
                </Bar>
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
