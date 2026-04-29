import type { CSSProperties } from "react";
import { BRANCHES, BRANCH_COLORS } from "@/lib/constants";
import type { BranchName } from "@/types";

const BRANCH_ICONS: Record<BranchName, string> = {
  "Supermarket": "🛒",
  "Gold Loan": "🥇",
  "ML Loan": "📊",
  "Vehicle Loan": "🚗",
  "Personal Loan": "👤",
};

interface Props {
  uploadedBranches: BranchName[];
  missingBranches: BranchName[];
}

type BranchStatusVars = CSSProperties & {
  "--status-bg": string;
  "--status-border": string;
};

export default function BranchUploadStatus({ uploadedBranches }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
      {BRANCHES.map((b) => {
        const uploaded = uploadedBranches.includes(b);
        const color = BRANCH_COLORS[b];
        const vars: BranchStatusVars = {
          "--status-bg": uploaded ? `${color}0A` : "#1A1D27",
          "--status-border": uploaded ? `${color}40` : "#2A2D3A",
        };

        return (
          <div
            key={b}
            className="flex flex-col items-center gap-2 rounded-xl p-3 border bg-[var(--status-bg)] border-[var(--status-border)] transition"
            style={vars}
          >
            <span className="text-xl">{BRANCH_ICONS[b]}</span>
            <span className="text-xs text-text-muted text-center leading-tight">{b}</span>
            <span className={`text-xs font-semibold ${uploaded ? "text-success" : "text-warning"}`}>
              {uploaded ? "Done" : "Pending"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
