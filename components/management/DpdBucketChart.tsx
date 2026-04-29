"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, CartesianGrid,
} from "recharts";
import { formatINRCompact } from "@/lib/utils";
import type { DpdBucketData } from "@/types";

const BUCKET_COLORS = ["#16A34A", "#65A30D", "#D97706", "#EA580C", "#DC2626", "#7F1D1D"];

export default function DpdBucketChart({ data }: { data: DpdBucketData[] }) {
  const chartData = data.map((d) => ({
    name: `${d.bucket}`,
    amount: d.amount,
    count: d.count,
  }));

  return (
    <div
      className="relative overflow-hidden rounded-xl p-5"
      style={{
        background: "#111116",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)" }}
      />
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold" style={{ color: "#E2E8F0" }}>
          DPD Bucket Distribution
        </h3>
        <span className="text-xs" style={{ color: "#64748B" }}>Days Past Due</span>
      </div>
      <ResponsiveContainer width="100%" height={210}>
        <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2A2A35" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: "#64748B", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip
            contentStyle={{
              background: "#18181F",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10,
              fontSize: 12,
              color: "#E2E8F0",
            }}
            labelStyle={{ color: "#E2E8F0", fontWeight: 600, marginBottom: 4 }}
            formatter={(value, _name, props) => [
              `${formatINRCompact(Number(value))} · ${props.payload.count} accounts`,
              "Amount",
            ]}
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
          />
          <Bar dataKey="amount" radius={[5, 5, 0, 0]} maxBarSize={48}>
            {chartData.map((_, i) => (
              <Cell key={`cell-${i}`} fill={BUCKET_COLORS[i] ?? "#2563EB"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
