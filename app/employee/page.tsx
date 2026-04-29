"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { BRANCHES, BRANCH_COLORS } from "@/lib/constants";
import type { BranchName, SessionUser } from "@/types";

const BRANCH_META: Record<BranchName, { icon: string; desc: string }> = {
  "Supermarket": { icon: "🛒", desc: "Retail and FMCG daily data" },
  "Gold Loan": { icon: "🥇", desc: "Gold-secured loan metrics" },
  "ML Loan": { icon: "📊", desc: "Microfinance loan data" },
  "Vehicle Loan": { icon: "🚗", desc: "Auto loan portfolio data" },
  "Personal Loan": { icon: "👤", desc: "Personal credit metrics" },
};

type BranchVars = CSSProperties & {
  "--branch-bg": string;
  "--branch-border": string;
  "--branch-color": string;
};

export default function EmployeePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const user = session?.user as SessionUser | undefined;
  const assigned = (user?.branches ?? []) as BranchName[];
  const available = BRANCHES.filter((b) => assigned.includes(b));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-main">Select Branch</h1>
        <p className="text-text-muted text-sm mt-1">Choose the branch you want to upload data for today.</p>
      </div>

      {available.length === 0 ? (
        <div className="bg-surface border border-warning/30 rounded-2xl p-8 text-center">
          <span className="text-4xl block mb-3">⚠️</span>
          <h3 className="text-text-main font-semibold mb-1">No branches assigned</h3>
          <p className="text-text-muted text-sm">Contact your admin to assign branches to your account.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {available.map((branch) => {
            const meta = BRANCH_META[branch];
            const color = BRANCH_COLORS[branch];
            const vars: BranchVars = {
              "--branch-bg": `${color}20`,
              "--branch-border": `${color}40`,
              "--branch-color": color,
            };

            return (
              <button
                key={branch}
                onClick={() => router.push(`/employee/upload?branch=${encodeURIComponent(branch)}`)}
                className="group text-left bg-surface border border-border rounded-2xl p-6 hover:border-[var(--branch-border)] active:scale-[0.98] transition-all duration-150 hover:shadow-lg hover:shadow-black/20"
                style={vars}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-[var(--branch-bg)] border border-[var(--branch-border)]">
                    {meta.icon}
                  </div>
                  <span className="text-text-muted text-xs opacity-0 group-hover:opacity-100 transition">Upload</span>
                </div>
                <h3 className="text-text-main font-semibold text-base mb-1">{branch}</h3>
                <p className="text-text-muted text-xs">{meta.desc}</p>
                <div className="mt-4 h-0.5 rounded-full opacity-30 bg-[var(--branch-color)]" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
