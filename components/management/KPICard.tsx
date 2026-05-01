import { formatINRCompact, cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Props {
  label: string;
  value: number;
  icon?: React.ReactNode;
  colorClass?: string;
  subtext?: React.ReactNode;
  onClick?: () => void;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}

export default function KPICard({ label, value, icon, colorClass = "bg-primary", subtext, onClick, trend, trendValue }: Props) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-success" : trend === "down" ? "text-danger" : "text-text-muted";

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-surface border border-border rounded-xl p-5 relative overflow-hidden flex flex-col justify-between",
        onClick && "cursor-pointer hover:border-primary/40 hover:bg-elevated transition-all duration-200 group"
      )}
    >
      {/* Left accent bar — replaces top strip */}
      <div className={cn("absolute top-0 left-0 w-1 h-full rounded-l-xl", colorClass)} />

      <div className="pl-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</h3>
          {icon && <span className="text-text-muted group-hover:text-text-primary transition-colors">{icon}</span>}
        </div>

        <div className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight tabular-nums">
          {formatINRCompact(value)}
        </div>

        <div className="flex items-center justify-between mt-2">
          {subtext && <div className="text-xs text-text-muted">{subtext}</div>}
          {trend && trendValue && (
            <div className={cn("flex items-center gap-1 text-xs font-medium", trendColor)}>
              <TrendIcon size={12} />
              {trendValue}
            </div>
          )}
        </div>

        {onClick && (
          <div className="mt-2 text-xs text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
            Click to view details →
          </div>
        )}
      </div>
    </div>
  );
}
