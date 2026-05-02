"use client";
import { BranchDailyMetric } from "@/types";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";
import { formatINRCompact } from "@/lib/utils";

interface Props {
  branches: BranchDailyMetric[];
}

const BRANCH_COLORS: Record<string, string> = {
  Supermarket: "#2563EB",
  "Gold Loan": "#D97706",
  "ML Loan": "#16A34A",
  "Vehicle Loan": "#DC2626",
  "Personal Loan": "#7C3AED",
};

function getBranchColor(name: string): string {
  return BRANCH_COLORS[name] ?? "#64748B";
}

type SliceEntry = {
  name: string;
  value: number;
  pct: number;
  color: string;
};

function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0].payload as SliceEntry;
  return (
    <div
      style={{
        backgroundColor: "#18181F",
        border: "1px solid #2A2A35",
        borderRadius: "8px",
        fontSize: "12px",
        padding: "10px 14px",
      }}
    >
      <p style={{ color: "#E2E8F0", fontWeight: 600, marginBottom: "4px" }}>{entry.name}</p>
      <p style={{ color: "#94A3B8" }}>{formatINRCompact(entry.value)}</p>
      <p style={{ color: entry.color, fontWeight: 600 }}>{entry.pct.toFixed(1)}%</p>
    </div>
  );
}

export default function PortfolioMixChart({ branches }: Props) {
  const total = branches.reduce((sum, b) => sum + b.closingBalance, 0);

  const slices: SliceEntry[] = branches.map((b) => ({
    name: b.branch,
    value: b.closingBalance,
    pct: total > 0 ? (b.closingBalance / total) * 100 : 0,
    color: getBranchColor(b.branch),
  }));

  return (
    <div className="space-y-4">
      <div className="h-[300px] w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="58%"
              outerRadius="80%"
              paddingAngle={2}
              isAnimationActive={false}
            >
              {slices.map((entry) => (
                <Cell key={entry.name} fill={entry.color} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label — absolutely centered inside the chart container */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
          style={{ paddingBottom: "0px" }}
        >
          <span className="text-lg font-bold text-text-primary leading-tight">
            {formatINRCompact(total)}
          </span>
          <span className="text-xs text-text-muted mt-0.5">Total AUM</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center">
        {slices.map((entry) => (
          <div key={entry.name} className="flex items-center gap-1.5">
            <div
              className="rounded-sm flex-shrink-0"
              style={{ width: 12, height: 12, backgroundColor: entry.color }}
            />
            <span className="text-xs text-text-muted">{entry.name}</span>
            <span className="text-xs font-medium text-text-primary">{entry.pct.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
