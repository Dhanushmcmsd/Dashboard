import { formatINRCompact, formatINR } from "@/lib/utils";

interface Props {
  label: string;
  value: number;
  icon: string;
  colorClass?: string;
  color?: string;
  subtext?: string;
}

const COLOR_MAP: Record<string, string> = {
  "text-primary": "#60A5FA",
  "text-success": "#4ADE80",
  "text-warning": "#FCD34D",
  "text-danger": "#F87171",
};

export default function KPICard({ label, value, icon, colorClass = "text-primary", color, subtext }: Props) {
  const resolvedColor = color ?? COLOR_MAP[colorClass] ?? "#60A5FA";

  return (
    <div
      className="relative overflow-hidden rounded-xl p-5 flex flex-col gap-3"
      style={{
        background: "#111116",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
      }}
    >
      {/* Top gloss line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)" }}
      />

      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <span
          className="text-xs font-medium uppercase tracking-wider leading-tight"
          style={{ color: "#64748B" }}
        >
          {label}
        </span>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
          style={{ background: "rgba(255,255,255,0.04)" }}
        >
          {icon}
        </div>
      </div>

      {/* Value */}
      <div>
        <span
          className="text-2xl font-bold font-mono leading-none"
          style={{ color: resolvedColor, fontVariantNumeric: "tabular-nums" }}
          title={formatINR(value)}
        >
          {formatINRCompact(value)}
        </span>
        {subtext && (
          <p className="text-xs mt-1" style={{ color: "#64748B" }}>{subtext}</p>
        )}
      </div>

      {/* Bottom accent bar */}
      <div
        className="absolute bottom-0 left-0 right-0 h-0.5 opacity-30"
        style={{ background: resolvedColor }}
      />
    </div>
  );
}
