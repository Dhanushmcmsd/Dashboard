import type { BranchName } from "@/types";

export default function MissingBranchBanner({ branches }: { branches: BranchName[] }) {
  if (branches.length === 0) return null;

  return (
    <div
      className="flex items-start gap-3 rounded-xl p-4 mb-5"
      style={{
        background: "rgba(220,38,38,0.06)",
        border: "1px solid rgba(220,38,38,0.2)",
        boxShadow: "0 0 0 1px rgba(220,38,38,0.05) inset",
      }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: "rgba(220,38,38,0.1)" }}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#DC2626">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <div>
        <p className="font-semibold text-sm" style={{ color: "#F87171" }}>
          {branches.length} branch{branches.length > 1 ? "es have" : " has"} not uploaded today
        </p>
        <p className="text-xs mt-1 leading-relaxed" style={{ color: "#64748B" }}>
          Missing:{" "}
          <span className="font-medium" style={{ color: "#E2E8F0" }}>
            {branches.join(", ")}
          </span>
          . Dashboard totals exclude these branches.
        </p>
      </div>
    </div>
  );
}
