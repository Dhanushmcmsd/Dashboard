"use client";

import { DpdBucketData } from "@/types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { formatINRCompact } from "@/lib/utils";

interface Props {
  data: DpdBucketData[];
}

const COLORS = [
  "#16A34A", // 0
  "#84CC16", // 1-30
  "#EAB308", // 31-60
  "#F59E0B", // 61-90
  "#EF4444", // 91-180
  "#991B1B", // 181+
];

export default function DpdBucketChart({ data }: Props) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
          <XAxis 
            dataKey="bucket" 
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
            contentStyle={{ backgroundColor: "#18181F", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
            formatter={(value: number, name: string) => {
              if (name === "amount") return [formatINRCompact(value), "Amount"];
              return [value, "Accounts"];
            }}
            labelStyle={{ color: "#E2E8F0", marginBottom: "4px" }}
          />
          <Bar dataKey="amount" radius={[4, 4, 0, 0]} maxBarSize={60}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
