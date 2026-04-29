"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from "recharts";
import { formatINRCompact } from "@/lib/utils";
import type { DpdBucketData } from "@/types";

const BUCKET_COLORS = ["#22C55E", "#84CC16", "#F59E0B", "#FB923C", "#EF4444", "#7F1D1D"];

export default function DpdBucketChart({ data }: { data: DpdBucketData[] }) {
  const chartData = data.map((d) => ({
    name: `${d.bucket} DPD`,
    amount: d.amount,
    count: d.count,
  }));

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <h3 className="text-sm font-semibold text-text-main mb-4">DPD Bucket Distribution</h3>
      <ResponsiveContainer width="100%" height={210}>
        <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2A2D3A" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip
            contentStyle={{ background: "#1A1D27", border: "1px solid #2A2D3A", borderRadius: 10, fontSize: 12 }}
            labelStyle={{ color: "#F1F5F9", fontWeight: 600 }}
            formatter={(value, _name, props) => [
              `${formatINRCompact(Number(value))} · ${props.payload.count} accounts`,
              "Amount",
            ]}
          />
          <Bar dataKey="amount" radius={[5, 5, 0, 0]}>
            {chartData.map((_, i) => (
              <Cell key={BUCKET_COLORS[i] ?? i} fill={BUCKET_COLORS[i] ?? "#4F6EF7"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
