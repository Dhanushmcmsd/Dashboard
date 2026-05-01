"use client";

import { DpdBucketData } from "@/types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea, Cell } from "recharts";
import { formatINRCompact } from "@/lib/utils";

interface Props {
  data: DpdBucketData[];
}

const BUCKET_COLORS: Record<string, string> = {
  "0": "#16A34A",
  "1-30": "#84CC16",
  "31-60": "#EAB308",
  "61-90": "#F59E0B",
  "91-180": "#EF4444",
  "181+": "#991B1B",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-elevated border border-border rounded-lg p-3 text-xs shadow-xl">
      <p className="text-text-primary font-semibold mb-1">DPD {label} days</p>
      <p className="text-text-muted">Amount: <span className="text-text-primary font-medium">{formatINRCompact(payload[0].value)}</span></p>
      <p className="text-text-muted">Accounts: <span className="text-text-primary font-medium">{payload[0].payload.count}</span></p>
    </div>
  );
};

export default function DpdBucketChart({ data }: Props) {
  const maxAmount = Math.max(...data.map(d => d.amount));

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 40, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.06)" />

          {/* Red risk zone behind NPA buckets */}
          <ReferenceArea y1="91-180" y2="91-180" x2={maxAmount} fill="#EF444408" ifOverflow="visible" />
          <ReferenceArea y1="181+" y2="181+" x2={maxAmount} fill="#EF444412" ifOverflow="visible" />

          <XAxis
            type="number"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748B", fontSize: 11 }}
            tickFormatter={(v) => formatINRCompact(v)}
          />
          <YAxis
            type="category"
            dataKey="bucket"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#94A3B8", fontSize: 12 }}
            width={48}
            tickFormatter={(v) => `${v}d`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
          <Bar dataKey="amount" radius={[0, 4, 4, 0]} maxBarSize={28}>
            {data.map((entry) => (
              <Cell key={entry.bucket} fill={BUCKET_COLORS[entry.bucket] ?? "#64748B"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
