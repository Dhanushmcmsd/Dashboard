"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
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
    <div className="bg-surface border border-border rounded-xl p-5">
      <h3 className="text-sm font-semibold text-text-main mb-4">Branch Comparison</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2A2D3A" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={(v) => formatINRCompact(Number(v))} tick={{ fill: "#94A3B8", fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: "#1A1D27", border: "1px solid #2A2D3A", borderRadius: 10, fontSize: 12 }}
            formatter={(value) => formatINRCompact(Number(value))}
          />
          <Legend wrapperStyle={{ color: "#94A3B8", fontSize: 12 }} />
          <Bar dataKey="Closing" fill="#4F6EF7" radius={[3, 3, 0, 0]} />
          <Bar dataKey="Disburse" fill="#10B981" radius={[3, 3, 0, 0]} />
          <Bar dataKey="Collect" fill="#F59E0B" radius={[3, 3, 0, 0]} />
          <Bar dataKey="NPA" fill="#EF4444" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
