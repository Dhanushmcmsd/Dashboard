"use client";

import React from "react";
import { X, BarChart2, LineChart, PieChart, LayoutDashboard, Table2, Gauge, AlertCircle, TrendingDown } from "lucide-react";
import { nanoid } from "nanoid";
import type { WidgetConfig, WidgetType } from "@/lib/types";

const WIDGET_PALETTE: { type: WidgetType; label: string; icon: React.ReactNode; defaultTitle: string }[] = [
  { type: "kpi_card",        label: "KPI Card",         icon: <LayoutDashboard size={20} />, defaultTitle: "KPI Card" },
  { type: "bar_chart",       label: "Bar Chart",        icon: <BarChart2 size={20} />,       defaultTitle: "Bar Chart" },
  { type: "line_chart",      label: "Line Chart",       icon: <LineChart size={20} />,       defaultTitle: "Line Chart" },
  { type: "pie_chart",       label: "Pie Chart",        icon: <PieChart size={20} />,        defaultTitle: "Pie Chart" },
  { type: "dpd_buckets",     label: "DPD Buckets",      icon: <TrendingDown size={20} />,    defaultTitle: "DPD Buckets" },
  { type: "branch_table",    label: "Branch Table",     icon: <Table2 size={20} />,          defaultTitle: "Branch Collections" },
  { type: "gauge",           label: "NPA Gauge",        icon: <Gauge size={20} />,           defaultTitle: "NPA %" },
  { type: "missing_branches",label: "Missing Branches", icon: <AlertCircle size={20} />,     defaultTitle: "Missing Branches" },
];

interface WidgetSidebarProps {
  onAdd: (widget: WidgetConfig) => void;
  onClose: () => void;
}

export function WidgetSidebar({ onAdd, onClose }: WidgetSidebarProps) {
  const handleAdd = (item: (typeof WIDGET_PALETTE)[number]) => {
    const widget: WidgetConfig = {
      id: nanoid(),
      type: item.type,
      title: item.defaultTitle,
      dataSource: item.type === "line_chart" ? "monthly_snapshot" : "daily_snapshot",
    };
    onAdd(widget);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <aside className="w-72 bg-background border-l shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-base">Add Widget</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-3">
          {WIDGET_PALETTE.map((item) => (
            <button
              key={item.type}
              onClick={() => handleAdd(item)}
              className="flex flex-col items-center gap-2 p-3 rounded-xl border bg-card hover:border-primary hover:bg-primary/5 transition-colors text-sm font-medium"
            >
              <span className="text-muted-foreground">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}
