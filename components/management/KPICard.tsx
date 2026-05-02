"use client";
import { useState } from "react";
import { formatINRCompact, formatINRFull } from "@/lib/utils";
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

export default function KPICard({
  label,
  value,
  icon,
  colorClass = "bg-[#064734]",
  subtext,
  onClick,
  trend,
  trendValue,
}: Props) {
  const [showFull, setShowFull] = useState(false);
  const TrendIcon  = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor =
    trend === "up"   ? "text-[#064734]" :
    trend === "down" ? "text-[#991b1b]" :
                       "text-[#4a7c5f]";

  return (
    <div
      onClick={onClick}
      className={[
        "bg-white border border-[#c8e6c0] rounded-3xl p-6",
        "relative overflow-hidden",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-2 hover:shadow-xl hover:shadow-[#064734]/10",
        "hover:border-[#064734]",
        onClick ? "cursor-pointer" : "",
        "group",
      ].join(" ")}
    >
      {/* Top accent line — slides in from left on hover */}
      <div
        className={[
          "absolute top-0 left-0 right-0 h-1 rounded-t-3xl",
          "transform scale-x-0 group-hover:scale-x-100",
          "transition-transform duration-300 origin-left",
          colorClass,
        ].join(" ")}
      />

      {/* Icon + label row */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold text-[#4a7c5f] uppercase tracking-widest">
          {label}
        </span>
        {icon && (
          <div
            className={[
              "w-8 h-8 bg-[#f0fce8] rounded-full",
              "flex items-center justify-center",
              "text-[#064734] group-hover:bg-[#064734] group-hover:text-white",
              "transition-all duration-300",
            ].join(" ")}
          >
            {icon}
          </div>
        )}
      </div>

      {/* Value with full Indian-notation tooltip */}
      <div
        className="relative w-fit"
        onMouseEnter={() => setShowFull(true)}
        onMouseLeave={() => setShowFull(false)}
      >
        <div
          className="text-3xl font-bold text-[#064734] tabular-nums"
          style={{ fontFamily: "var(--font-data)", fontVariantNumeric: "tabular-nums" }}
        >
          {formatINRCompact(value)}
        </div>

        {showFull && (
          <div className="absolute bottom-full left-0 mb-2 z-50 whitespace-nowrap">
            <div
              className="bg-[#064734] text-white text-xs font-mono px-3 py-1.5 rounded-lg shadow-lg"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {formatINRFull(value)}
            </div>
            <div className="w-2 h-2 bg-[#064734] rotate-45 ml-4 -mt-1" />
          </div>
        )}
      </div>

      {/* Subtext + trend row */}
      <div className="flex items-center justify-between mt-2">
        {subtext && (
          <p className="text-xs text-[#4a7c5f]">{subtext}</p>
        )}
        {trend && trendValue && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${trendColor}`}>
            <TrendIcon size={12} />
            {trendValue}
          </div>
        )}
      </div>

      {/* "Click to view" hint */}
      {onClick && (
        <p className="mt-3 text-xs text-[#4a7c5f] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          Click to view details →
        </p>
      )}
    </div>
  );
}
