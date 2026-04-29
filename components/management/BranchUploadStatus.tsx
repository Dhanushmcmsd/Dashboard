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

export default function BranchUploadStatus({ uploadedBranches }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
      {BRANCHES.map((b) => {
        const uploaded = uploadedBranches.includes(b);
        const color = BRANCH_COLORS[b];

        return (
          <div
            key={b}
            className="relative overflow-hidden flex flex-col items-center gap-2 rounded-xl p-3 transition-all"
            style={{
              background: uploaded ? `${color}08` : "#111116",
              border: `1px solid ${uploaded ? `${color}30` : "rgba(255,255,255,0.06)"}`,
            }}
          >
            {/* Top highlight */}
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)" }}
            />

            <span className="text-xl">{BRANCH_ICONS[b]}</span>
            <span className="text-xs text-center leading-tight" style={{ color: "#94A3B8" }}>{b}</span>

            <div className="flex items-center gap-1">
              {uploaded ? (
                <>
                  <span
                    className="w-1.5 h-1.5 rounded-full pulse-dot"
                    style={{ background: "#16A34A" }}
                  />
                  <span className="text-xs font-semibold" style={{ color: "#4ADE80" }}>Done</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#D97706" }} />
                  <span className="text-xs font-semibold" style={{ color: "#FCD34D" }}>Pending</span>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
