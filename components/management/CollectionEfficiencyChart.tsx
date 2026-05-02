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
    <div
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #c8e6c0",
        borderRadius: "12px",
        fontSize: "12px",
        padding: "10px 14px",
        boxShadow: "0 4px 12px rgba(6,71,52,0.10)",
      }}
    >
      <p style={{ color: "#4a7c5f", fontWeight: 500, marginBottom: "4px" }}>{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: p.color, display: "inline-block" }} />
          <span style={{ color: "#4a7c5f" }}>{p.name}:</span>
          <span style={{ color: "#064734", fontWeight: 600 }}>
            {p.name === "Efficiency %" ? `${p.value.toFixed(1)}%` : formatINRCompact(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function CollectionEfficiencyChart({ data }: Props) {
  if (!data.length) return (
    <div className="h-[280px] flex items-center justify-center text-[#4a7c5f] text-sm">
      No efficiency data available for this period
    </div>
  );

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 40, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#c8e6c0" strokeOpacity={0.6} />
          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#4a7c5f", fontSize: 11 }} />
          <YAxis
            yAxisId="left"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#4a7c5f", fontSize: 11 }}
            tickFormatter={(v) => `${v}%`}
            domain={[0, 100]}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#4a7c5f", fontSize: 11 }}
            tickFormatter={(v) => formatINRCompact(v)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "12px", color: "#4a7c5f" }} />
          <Area
            yAxisId="right"
            type="monotone"
            dataKey="overdueBalance"
            name="Overdue Balance"
            fill="#991b1b15"
            stroke="#991b1b"
            strokeWidth={1.5}
            dot={false}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="efficiency"
            name="Efficiency %"
            stroke="#064734"
            strokeWidth={2.5}
            dot={{ fill: "#064734", r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "#0a7c5c" }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
