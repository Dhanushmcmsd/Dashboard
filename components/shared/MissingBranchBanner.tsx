import type { BranchName } from "@/types";

export default function MissingBranchBanner({ branches }: { branches: BranchName[] }) {
  if (branches.length === 0) return null;

  return (
    <div className="flex items-start gap-3 bg-warning/10 border border-warning/30 rounded-xl p-4 mb-5">
      <span className="text-warning text-xl mt-0.5 shrink-0">⚠️</span>
      <div>
        <p className="text-warning font-semibold text-sm">
          {branches.length} branch{branches.length > 1 ? "es have" : " has"} not uploaded today
        </p>
        <p className="text-text-muted text-xs mt-0.5 leading-relaxed">
          Missing: <span className="text-text-main font-medium">{branches.join(", ")}</span>. Dashboard totals exclude these branches.
        </p>
      </div>
    </div>
  );
}
