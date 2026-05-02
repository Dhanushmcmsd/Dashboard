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
} from "recharts";
import { formatINRCompact } from "@/lib/utils";

interface Props {
  branches: BranchDailyMetric[];
}

type ViewMode = "aum" | "risk" | "efficiency";

// Forest-green palette matching Ascone Finance design
export const CHART_COLORS = {
  primary:   "#064734",
  secondary: "#a8d5b5",
  accent1:   "#0a7c5c",
  accent2:   "#4aaa6f",
  accent3:   "#85c9a0",
  danger:    "#991b1b",
  warning:   "#b45309",
} as const;

const BRANCH_COLORS: Record<string, string> = {
  Supermarket:     CHART_COLORS.primary,
  "Gold Loan":     CHART_COLORS.warning,
  "ML Loan":       CHART_COLORS.accent1,
  "Vehicle Loan":  CHART_COLORS.danger,
  "Personal Loan": CHART_COLORS.accent2,
};

function getBranchColor(fullName: string): string {
  return BRANCH_COLORS[fullName] ?? CHART_COLORS.accent3;
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

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function formatPctLabel(v: unknown): string {
  if (v === null || v === undefined || v === false) return "";
  const n = typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : NaN;
  return isNaN(n) ? "" : `${n.toFixed(1)}%`;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #c8e6c0",
        borderRadius: "12px",
        fontSize: "12px",
        padding: "10px 14px",
        minWidth: "160px",
        boxShadow: "0 4px 12px rgba(6,71,52,0.10)",
      }}
    >
      <p style={{ color: "#064734", marginBottom: "6px", fontWeight: 600, textTransform: "uppercase", fontSize: "11px", letterSpacing: "0.05em" }}>{label}</p>
      {payload.map((entry) => {
        const isPercent = entry.name === "CollectionEfficiency" || entry.name === "GNPAPct";
        const formatted = isPercent ? `${entry.value.toFixed(1)}%` : formatINRCompact(entry.value);
        const displayName =
          entry.name === "CollectionEfficiency" ? "Coll. Efficiency"
          : entry.name === "GNPAPct"            ? "GNPA %"
          : entry.name === "MTDDisbursement"    ? "MTD Disb."
          : entry.name;
        return (
          <div key={entry.name} style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
            <span style={{ color: "#4a7c5f" }}>{displayName}</span>
            <span style={{ fontWeight: 600, color: entry.color, fontVariantNumeric: "tabular-nums" }}>{formatted}</span>
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
    { key: "aum",        label: "AUM View"        },
    { key: "risk",       label: "Risk View"       },
    { key: "efficiency", label: "Efficiency View" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex border-b border-[#c8e6c0]">
        {VIEWS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setView(key)}
            className={`px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 -mb-px ${
              view === key
                ? "border-[#064734] text-[#064734]"
                : "border-transparent text-[#4a7c5f] hover:text-[#064734]"
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
              strokeDasharray=""
              vertical={false}
              stroke="#c8e6c0"
              strokeOpacity={0.6}
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#4a7c5f", fontSize: 12 }}
              dy={10}
            />

            {view === "efficiency" ? (
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#4a7c5f", fontSize: 11 }}
                tickFormatter={(v: number) => `${v.toFixed(0)}%`}
                domain={[0, 120]}
              />
            ) : (
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#4a7c5f", fontSize: 11 }}
                tickFormatter={(v: number) => formatINRCompact(v)}
              />
            )}

            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(6,71,52,0.04)" }}
            />
            <Legend wrapperStyle={{ paddingTop: "16px", fontSize: "12px", color: "#4a7c5f" }} />

            {view === "aum" && (
              <>
                <Bar dataKey="Closing" name="Closing" radius={[4,4,0,0]} maxBarSize={36} isAnimationActive animationDuration={600} animationEasing="ease-out">
                  {data.map((entry) => (<Cell key={entry.fullName} fill={getBranchColor(entry.fullName)} />))}
                </Bar>
                <Bar dataKey="MTDDisbursement" name="MTDDisbursement" fill={CHART_COLORS.accent2} radius={[4,4,0,0]} maxBarSize={36} isAnimationActive animationDuration={600} animationEasing="ease-out" />
              </>
            )}

            {view === "risk" && (
              <>
                <ReferenceArea y1={0} fill={`${CHART_COLORS.danger}08`} ifOverflow="extendDomain" />
                <Bar dataKey="Collection" name="Collection" fill={CHART_COLORS.accent1} radius={[4,4,0,0]} maxBarSize={36} isAnimationActive animationDuration={600} animationEasing="ease-out" />
                <Bar dataKey="NPA" name="NPA" fill={CHART_COLORS.danger} radius={[4,4,0,0]} maxBarSize={36} isAnimationActive animationDuration={600} animationEasing="ease-out" />
              </>
            )}

            {view === "efficiency" && (
              <>
                <Bar dataKey="CollectionEfficiency" name="CollectionEfficiency" fill={CHART_COLORS.primary} radius={[4,4,0,0]} maxBarSize={36} isAnimationActive animationDuration={600} animationEasing="ease-out">
                  <LabelList dataKey="CollectionEfficiency" position="top" formatter={formatPctLabel} style={{ fill: "#4a7c5f", fontSize: 10 }} />
                </Bar>
                <Bar dataKey="GNPAPct" name="GNPAPct" fill={CHART_COLORS.danger} radius={[4,4,0,0]} maxBarSize={36} isAnimationActive animationDuration={600} animationEasing="ease-out">
                  <LabelList dataKey="GNPAPct" position="top" formatter={formatPctLabel} style={{ fill: "#4a7c5f", fontSize: 10 }} />
                </Bar>
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
