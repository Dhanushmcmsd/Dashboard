import { formatINRCompact, formatINR } from "@/lib/utils";

interface Props {
  label: string;
  value: number;
  icon: string;
  colorClass?: string;
  subtext?: string;
}

export default function KPICard({ label, value, icon, colorClass = "text-primary", subtext }: Props) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-text-muted text-xs font-medium uppercase tracking-wider leading-tight">{label}</span>
        <span className="text-lg">{icon}</span>
      </div>
      <span className={`text-2xl font-bold font-mono ${colorClass}`} title={formatINR(value)}>
        {formatINRCompact(value)}
      </span>
      {subtext && <span className="text-text-muted text-xs">{subtext}</span>}
    </div>
  );
}
