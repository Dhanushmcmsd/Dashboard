"use client";

import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatINRCompact } from "@/lib/utils";

export interface EfficiencyDataPoint {
  date: string;
  efficiency: number;      // percentage, e.g. 87.5
  overdueBalance: number;  // INR amount
}

interface Props {
  data: EfficiencyDataPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-elevated border border-border rounded-lg p-3 text-xs shadow-xl space-y-1">
      <p className="text-text-muted font-medium">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-text-muted">{p.name}:</span>
          <span className="text-text-primary font-semibold">
            {p.name === "Efficiency %" ? `${p.value.toFixed(1)}%` : formatINRCompact(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function CollectionEfficiencyChart({ data }: Props) {
  if (!data.length) return (
    <div className="h-[280px] flex items-center justify-center text-text-muted text-sm">
      No efficiency data available for this period
    </div>
  );

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 40, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 11 }} />
          <YAxis
            yAxisId="left"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748B", fontSize: 11 }}
            tickFormatter={(v) => `${v}%`}
            domain={[0, 100]}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748B", fontSize: 11 }}
            tickFormatter={(v) => formatINRCompact(v)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} />
          <Area
            yAxisId="right"
            type="monotone"
            dataKey="overdueBalance"
            name="Overdue Balance"
            fill="#EF444415"
            stroke="#EF4444"
            strokeWidth={1.5}
            dot={false}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="efficiency"
            name="Efficiency %"
            stroke="#2563EB"
            strokeWidth={2.5}
            dot={{ fill: "#2563EB", r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
