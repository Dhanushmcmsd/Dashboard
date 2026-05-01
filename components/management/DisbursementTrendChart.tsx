"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { formatINRCompact } from "@/lib/utils";

interface Props {
  ftd: number;
  mtd: number;
  ytd: number;
}

export default function DisbursementTrendChart({ ftd, mtd, ytd }: Props) {
  const data = [
    { period: "FTD", value: ftd, fill: "#2563EB" },
    { period: "MTD", value: mtd, fill: "#7C3AED" },
    { period: "YTD", value: ytd, fill: "#16A34A" },
  ];

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="period"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#94A3B8", fontSize: 13, fontWeight: 500 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748B", fontSize: 11 }}
            tickFormatter={(v) => formatINRCompact(v)}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            contentStyle={{ backgroundColor: "#18181F", border: "1px solid #2A2A35", borderRadius: "8px", fontSize: "12px" }}
            formatter={(v: any) => [formatINRCompact(v), "Disbursement"]}
            labelStyle={{ color: "#E2E8F0" }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={56}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
