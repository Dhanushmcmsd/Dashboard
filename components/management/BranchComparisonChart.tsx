"use client";

import { BranchDailyMetric } from "@/types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatINRCompact } from "@/lib/utils";

interface Props {
  branches: BranchDailyMetric[];
}

export default function BranchComparisonChart({ branches }: Props) {
  const data = branches.map((b) => ({
    name: b.branch.replace(" Loan", "").replace("Supermarket", "SM"),
    Closing: b.closingBalance,
    Disbursement: b.disbursement,
    Collection: b.collection,
    NPA: b.npa,
  }));

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
          <XAxis 
            dataKey="name" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748B", fontSize: 12 }}
            dy={10}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748B", fontSize: 12 }}
            tickFormatter={(value) => formatINRCompact(value)}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.05)" }}
            contentStyle={{ backgroundColor: "#18181F", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#E2E8F0" }}
            formatter={(value: number) => formatINRCompact(value)}
          />
          <Legend wrapperStyle={{ paddingTop: "20px" }} />
          <Bar dataKey="Closing" fill="#3B82F6" radius={[2, 2, 0, 0]} />
          <Bar dataKey="Disbursement" fill="#10B981" radius={[2, 2, 0, 0]} />
          <Bar dataKey="Collection" fill="#8B5CF6" radius={[2, 2, 0, 0]} />
          <Bar dataKey="NPA" fill="#EF4444" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
