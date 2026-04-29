"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend,
} from "recharts";
import type { BranchDailyMetric } from "@/types";
import { formatINRCompact } from "@/lib/utils";

export default function BranchComparisonChart({ branches }: { branches: BranchDailyMetric[] }) {
  const data = branches.map((b) => ({
    name: b.branch.split(" ")[0],
    Closing: b.closingBalance,
    Disburse: b.disbursement,
    Collect: b.collection,
    NPA: b.npa,
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
      <h3 className="text-sm font-semibold mb-4" style={{ color: "#E2E8F0" }}>
        Branch Comparison
      </h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2A2A35" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: "#64748B", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => formatINRCompact(Number(v))}
            tick={{ fill: "#64748B", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "#18181F",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10,
              fontSize: 12,
              color: "#E2E8F0",
            }}
            formatter={(value) => formatINRCompact(Number(value))}
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
          />
          <Legend
            wrapperStyle={{ color: "#64748B", fontSize: 12 }}
          />
          <Bar dataKey="Closing" fill="#2563EB" radius={[3, 3, 0, 0]} maxBarSize={32} />
          <Bar dataKey="Disburse" fill="#16A34A" radius={[3, 3, 0, 0]} maxBarSize={32} />
          <Bar dataKey="Collect" fill="#D97706" radius={[3, 3, 0, 0]} maxBarSize={32} />
          <Bar dataKey="NPA" fill="#DC2626" radius={[3, 3, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
