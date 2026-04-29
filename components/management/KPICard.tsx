import { formatINRCompact, cn } from "@/lib/utils";

interface Props {
  label: string;
  value: number;
  icon?: string;
  colorClass?: string;
  subtext?: React.ReactNode;
}

export default function KPICard({ label, value, icon, colorClass = "bg-primary", subtext }: Props) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5 relative overflow-hidden flex flex-col justify-between">
      <div className={cn("absolute top-0 left-0 w-full h-1", colorClass)} />
      
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-text-muted">{label}</h3>
        {icon && <span className="text-lg">{icon}</span>}
      </div>
      
      <div>
        <div className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
          {formatINRCompact(value)}
        </div>
        {subtext && <div className="mt-2 text-xs text-text-muted">{subtext}</div>}
      </div>
      
      <div className={cn("absolute bottom-0 left-0 w-full h-1 opacity-20", colorClass)} />
    </div>
  );
}
