"use client";

import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from "recharts";
import { cn } from "@/lib/utils";

interface Props {
  gnpaPct: number;    // e.g. 3.7
  gnpaAmount: number; // for subtitle
  totalAum: number;
}

export default function GnpaGauge({ gnpaPct, gnpaAmount, totalAum }: Props) {
  const capped = Math.min(gnpaPct, 100);

  // Color: green <3%, amber 3-7%, red >7%
  const gaugeColor = gnpaPct < 3 ? "#16A34A" : gnpaPct < 7 ? "#D97706" : "#DC2626";
  const statusLabel = gnpaPct < 3 ? "Healthy" : gnpaPct < 7 ? "Elevated" : "Critical";
  const statusClass = gnpaPct < 3 ? "text-success" : gnpaPct < 7 ? "text-warning" : "text-danger";

  const data = [{ name: "GNPA", value: capped, fill: gaugeColor }];

  return (
    <div className="bg-surface border border-border rounded-xl p-5 relative overflow-hidden flex flex-col">
      {/* Left accent */}
      <div className="absolute top-0 left-0 w-1 h-full rounded-l-xl" style={{ backgroundColor: gaugeColor }} />

      <div className="pl-3">
        <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">GNPA Ratio</h3>
        <p className="text-xs text-text-muted mb-3">DPD &gt;90 days / Total AUM</p>

        <div className="relative h-[120px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              innerRadius="65%"
              outerRadius="90%"
              startAngle={225}
              endAngle={-45}
              data={data}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <RadialBar dataKey="value" cornerRadius={4} background={{ fill: "#18181F" }} />
            </RadialBarChart>
          </ResponsiveContainer>

          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-text-primary tabular-nums">{gnpaPct.toFixed(1)}%</span>
            <span className={cn("text-xs font-medium mt-0.5", statusClass)}>{statusLabel}</span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs">
          <span className="text-text-muted">GNPA Amount</span>
          <span className="text-text-primary font-semibold tabular-nums">
            {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", notation: "compact", maximumFractionDigits: 2 }).format(gnpaAmount)}
          </span>
        </div>
      </div>
    </div>
  );
}
