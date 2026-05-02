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

// Supra Pacific navy palette — no consumer-bright colors
const BRANCH_COLORS: Record<string, string> = {
  Supermarket:    "#1D4ED8",
  "Gold Loan":    "#D97706",
  "ML Loan":      "#16A34A",
  "Vehicle Loan": "#C8102E",
  "Personal Loan":"#7C3AED",
};

function getBranchColor(fullName: string): string {
  return BRANCH_COLORS[fullName] ?? "#4A6FA5";
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
        backgroundColor: "#1C2A3E",
        border: "1px solid #1E2D42",
        borderRadius: "8px",
        fontSize: "12px",
        padding: "10px 14px",
        minWidth: "160px",
      }}
    >
      <p style={{ color: "#E2E8F0", marginBottom: "6px", fontWeight: 600, textTransform: "uppercase", fontSize: "11px", letterSpacing: "0.05em" }}>{label}</p>
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
            <span style={{ color: "#94A3B8" }}>{displayName}</span>
            <span style={{ fontWeight: 600, color: entry.color, fontVariantNumeric: "tabular-nums", fontFamily: "var(--font-data)" }}>{formatted}</span>
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
      {/* Underline tab style — formal financial */}
      <div className="flex border-b border-border">
        {VIEWS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setView(key)}
            className={`px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 -mb-px ${
              view === key
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text-primary"
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

            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(28,42,62,0.6)" }}
            />
            <Legend wrapperStyle={{ paddingTop: "16px", fontSize: "12px" }} />

            {view === "aum" && (
              <>
                <Bar dataKey="Closing" name="Closing" radius={[3,3,0,0]} maxBarSize={36} isAnimationActive animationDuration={600} animationEasing="ease-out">
                  {data.map((entry) => (<Cell key={entry.fullName} fill={getBranchColor(entry.fullName)} />))}
                </Bar>
                <Bar dataKey="MTDDisbursement" name="MTDDisbursement" fill="#16A34A" radius={[3,3,0,0]} maxBarSize={36} isAnimationActive animationDuration={600} animationEasing="ease-out" />
              </>
            )}

            {view === "risk" && (
              <>
                <ReferenceArea y1={0} fill="#C8102E10" ifOverflow="extendDomain" />
                <Bar dataKey="Collection" name="Collection" fill="#1D4ED8" radius={[3,3,0,0]} maxBarSize={36} isAnimationActive animationDuration={600} animationEasing="ease-out" />
                <Bar dataKey="NPA" name="NPA" fill="#C8102E" radius={[3,3,0,0]} maxBarSize={36} isAnimationActive animationDuration={600} animationEasing="ease-out" />
              </>
            )}

            {view === "efficiency" && (
              <>
                <Bar dataKey="CollectionEfficiency" name="CollectionEfficiency" fill="#1D4ED8" radius={[3,3,0,0]} maxBarSize={36} isAnimationActive animationDuration={600} animationEasing="ease-out">
                  <LabelList dataKey="CollectionEfficiency" position="top" formatter={formatPctLabel} style={{ fill: "#94A3B8", fontSize: 10 }} />
                </Bar>
                <Bar dataKey="GNPAPct" name="GNPAPct" fill="#C8102E" radius={[3,3,0,0]} maxBarSize={36} isAnimationActive animationDuration={600} animationEasing="ease-out">
                  <LabelList dataKey="GNPAPct" position="top" formatter={formatPctLabel} style={{ fill: "#94A3B8", fontSize: 10 }} />
                </Bar>
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
