"use client";

import { DpdBucketData } from "@/types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { formatINRCompact } from "@/lib/utils";

interface Props {
  data: DpdBucketData[];
}

// Forest-green palette — green for healthy, amber/red for overdue
const BUCKET_COLORS: Record<string, string> = {
  "0":      "#064734",
  "1-30":   "#0a7c5c",
  "31-60":  "#4aaa6f",
  "61-90":  "#b45309",
  "91-180": "#991b1b",
  "181+":   "#7f1d1d",
};

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
      <p style={{ color: "#064734", fontWeight: 600, marginBottom: "4px" }}>DPD {label} days</p>
      <p style={{ color: "#4a7c5f" }}>Amount: <span style={{ color: "#064734", fontWeight: 600 }}>{formatINRCompact(payload[0].value)}</span></p>
      <p style={{ color: "#4a7c5f" }}>Accounts: <span style={{ color: "#064734", fontWeight: 600 }}>{payload[0].payload.count}</span></p>
    </div>
  );
};

export default function DpdBucketChart({ data }: Props) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 40, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#c8e6c0" strokeOpacity={0.6} />

          <XAxis
            type="number"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#4a7c5f", fontSize: 11 }}
            tickFormatter={(v) => formatINRCompact(v)}
          />
          <YAxis
            type="category"
            dataKey="bucket"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#4a7c5f", fontSize: 12 }}
            width={48}
            tickFormatter={(v) => `${v}d`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(6,71,52,0.04)" }} />
          <Bar dataKey="amount" radius={[0, 4, 4, 0]} maxBarSize={28}>
            {data.map((entry) => (
              <Cell key={entry.bucket} fill={BUCKET_COLORS[entry.bucket] ?? "#85c9a0"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
