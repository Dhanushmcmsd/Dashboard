"use client";

import { useState } from "react";
import { BranchDailyMetric } from "@/types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatINRCompact } from "@/lib/utils";

interface Props {
  branches: BranchDailyMetric[];
}

type ViewMode = "aum" | "risk";

export default function BranchComparisonChart({ branches }: Props) {
  const [view, setView] = useState<ViewMode>("aum");

  const data = branches.map((b) => ({
    name: b.branch.replace(" Loan", "").replace("Supermarket", "SM"),
    Closing: b.closingBalance,
    Disbursement: b.disbursement,
    Collection: b.collection,
    NPA: b.npa,
  }));

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className="flex items-center gap-1 bg-elevated border border-border rounded-lg p-1 w-fit">
        {(["aum", "risk"] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setView(mode)}
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
              view === mode
                ? "bg-primary text-white shadow-sm"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            {mode === "aum" ? "AUM View" : "Risk View"}
          </button>
        ))}
      </div>

      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 12 }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 11 }} tickFormatter={(v) => formatINRCompact(v)} />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
              contentStyle={{ backgroundColor: "#18181F", border: "1px solid #2A2A35", borderRadius: "8px", fontSize: "12px" }}
              formatter={(v: any) => formatINRCompact(v)}
              labelStyle={{ color: "#E2E8F0", marginBottom: "4px" }}
            />
            <Legend wrapperStyle={{ paddingTop: "16px", fontSize: "12px" }} />

            {view === "aum" ? (
              <>
                <Bar dataKey="Closing" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="Disbursement" fill="#16A34A" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </>
            ) : (
              <>
                <Bar dataKey="Collection" fill="#7C3AED" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="NPA" fill="#DC2626" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </>
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
