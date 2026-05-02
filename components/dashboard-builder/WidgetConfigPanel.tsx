"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import type { WidgetConfig, WidgetType, DataSource } from "@/lib/types";
import { WIDGET_TYPES, DATA_SOURCES } from "@/lib/types";

const METRICS_BY_SOURCE: Record<DataSource, { label: string; value: string }[]> = {
  daily_snapshot: [
    { label: "Closing Balance", value: "closingBalance" },
    { label: "NPA %", value: "npaPercent" },
    { label: "DPD 0", value: "dpd0" },
    { label: "DPD 30", value: "dpd30" },
    { label: "DPD 60", value: "dpd60" },
    { label: "DPD 90+", value: "dpd90" },
    { label: "Collection Amount", value: "amount" },
  ],
  monthly_snapshot: [
    { label: "Monthly Collection", value: "totalCollection" },
    { label: "Outstanding", value: "outstanding" },
    { label: "NPA %", value: "npaPercent" },
  ],
};

interface WidgetConfigPanelProps {
  widget: WidgetConfig;
  onApply: (updated: WidgetConfig) => void;
  onClose: () => void;
}

export function WidgetConfigPanel({ widget, onApply, onClose }: WidgetConfigPanelProps) {
  const [form, setForm] = useState<WidgetConfig>({ ...widget });

  const set = <K extends keyof WidgetConfig>(key: K, value: WidgetConfig[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleApply = () => onApply(form);

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <aside className="w-80 bg-background border-l shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold">Configure Widget</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Title */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Title</label>
            <input
              className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>

          {/* Widget type */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Widget Type</label>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              value={form.type}
              onChange={(e) => set("type", e.target.value as WidgetType)}
            >
              {WIDGET_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
            </select>
          </div>

          {/* Data source */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Data Source</label>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              value={form.dataSource}
              onChange={(e) => set("dataSource", e.target.value as DataSource)}
            >
              {DATA_SOURCES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
            </select>
          </div>

          {/* Metric */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Metric</label>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              value={form.metric ?? ""}
              onChange={(e) => set("metric", e.target.value || undefined)}
            >
              <option value="">(default)</option>
              {METRICS_BY_SOURCE[form.dataSource].map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Date range — From */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Date From</label>
            <input
              type="date"
              className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              value={form.dateRange?.from ?? ""}
              onChange={(e) => set("dateRange", { ...form.dateRange, from: e.target.value || undefined })}
            />
          </div>

          {/* Date range — To */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Date To</label>
            <input
              type="date"
              className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              value={form.dateRange?.to ?? ""}
              onChange={(e) => set("dateRange", { ...form.dateRange, to: e.target.value || undefined })}
            />
          </div>
        </div>

        <div className="p-4 border-t">
          <button
            onClick={handleApply}
            className="w-full py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Apply
          </button>
        </div>
      </aside>
    </div>
  );
}
