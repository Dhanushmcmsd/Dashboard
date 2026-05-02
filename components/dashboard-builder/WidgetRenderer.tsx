"use client";

import React from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  RadialBarChart, RadialBar, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { MoreVertical, GripVertical, Settings, Trash2 } from "lucide-react";
import type { WidgetConfig } from "@/lib/types";
import { useDashboardData } from "./hooks/useDashboardData";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

interface WidgetRendererProps {
  config: WidgetConfig;
  isShared: boolean;
  onConfigure: () => void;
  onDelete: () => void;
}

export function WidgetRenderer({ config, isShared, onConfigure, onDelete }: WidgetRendererProps) {
  const { data, isLoading, error } = useDashboardData(config);

  return (
    <div className="flex flex-col h-full">
      {/* Drag handle header */}
      <div className="widget-drag-handle flex items-center justify-between px-3 py-2 border-b bg-muted/30 cursor-grab active:cursor-grabbing">
        <div className="flex items-center gap-2 min-w-0">
          <GripVertical size={14} className="text-muted-foreground shrink-0" />
          <span className="text-sm font-medium truncate">{config.title}</span>
        </div>
        {!isShared && (
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={onConfigure} className="p-1 rounded hover:bg-muted" title="Configure">
              <Settings size={14} />
            </button>
            <button onClick={onDelete} className="p-1 rounded hover:bg-destructive/10 hover:text-destructive" title="Delete">
              <Trash2 size={14} />
            </button>
          </div>
        )}
        {isShared && <MoreVertical size={14} className="text-muted-foreground" />}
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 p-2">
        {isLoading && <SkeletonBody />}
        {error && <ErrorBody message={error.message} />}
        {!isLoading && !error && <WidgetBody config={config} data={data} />}
      </div>
    </div>
  );
}

function SkeletonBody() {
  return (
    <div className="animate-pulse space-y-2 h-full">
      <div className="h-4 bg-muted rounded w-3/4" />
      <div className="h-4 bg-muted rounded w-1/2" />
      <div className="flex-1 bg-muted rounded" style={{ height: "60%" }} />
    </div>
  );
}

function ErrorBody({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-destructive text-sm gap-1">
      <span>⚠ Failed to load</span>
      <span className="text-xs text-muted-foreground">{message}</span>
    </div>
  );
}

function WidgetBody({ config, data }: { config: WidgetConfig; data: unknown }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = data as any;

  switch (config.type) {
    case "kpi_card": {
      const metric = config.metric ?? "closingBalance";
      const value = d?.[metric] ?? d?.closingBalance;
      return (
        <div className="flex flex-col justify-center h-full gap-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{config.metric ?? "Closing Balance"}</p>
          <p className="text-3xl font-bold">
            {value != null ? (typeof value === "number" ? value.toLocaleString("en-IN") : value) : "—"}
          </p>
        </div>
      );
    }

    case "bar_chart": {
      const chartData = Array.isArray(d?.branchData) ? d.branchData : [];
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="branch" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey={config.metric ?? "amount"} fill={COLORS[0]} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    case "line_chart": {
      const chartData = Array.isArray(d?.data) ? d.data : [];
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Line type="monotone" dataKey={config.metric ?? "value"} stroke={COLORS[0]} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    case "pie_chart": {
      const dpd = d?.dpdDistribution ?? [];
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={dpd} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="70%" label>
              {dpd.map((_: unknown, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip />
            <Legend iconSize={10} />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    case "dpd_buckets": {
      const buckets = Array.isArray(d?.branchData) ? d.branchData : [];
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={buckets} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="branch" tick={{ fontSize: 9 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Legend iconSize={10} />
            <Bar dataKey="dpd0" name="DPD 0" fill={COLORS[1]} stackId="a" />
            <Bar dataKey="dpd30" name="DPD 30" fill={COLORS[2]} stackId="a" />
            <Bar dataKey="dpd60" name="DPD 60" fill={COLORS[3]} stackId="a" />
            <Bar dataKey="dpd90" name="DPD 90+" fill={COLORS[4]} stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    case "branch_table": {
      const rows: { branch: string; amount: number }[] = Array.isArray(d?.branchData) ? d.branchData : [];
      return (
        <div className="overflow-auto h-full text-xs">
          <table className="w-full">
            <thead className="sticky top-0 bg-background">
              <tr><th className="text-left py-1 px-2">Branch</th><th className="text-right py-1 px-2">Amount</th></tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t hover:bg-muted/30">
                  <td className="py-1 px-2">{r.branch}</td>
                  <td className="py-1 px-2 text-right">{r.amount?.toLocaleString("en-IN")}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={2} className="py-4 text-center text-muted-foreground">No data</td></tr>}
            </tbody>
          </table>
        </div>
      );
    }

    case "gauge": {
      const npa = d?.npaPercent ?? 0;
      const gaugeData = [{ name: "NPA %", value: npa, fill: npa > 5 ? COLORS[3] : COLORS[1] }];
      return (
        <div className="flex flex-col items-center justify-center h-full gap-1">
          <ResponsiveContainer width="100%" height="80%">
            <RadialBarChart innerRadius="60%" outerRadius="90%" data={gaugeData} startAngle={180} endAngle={0}>
              <RadialBar dataKey="value" cornerRadius={6} />
              <Tooltip />
            </RadialBarChart>
          </ResponsiveContainer>
          <p className="text-2xl font-bold">{npa}%</p>
          <p className="text-xs text-muted-foreground">NPA Percent</p>
        </div>
      );
    }

    case "missing_branches": {
      const missing: string[] = d?.missingBranches ?? [];
      return (
        <div className="overflow-auto h-full">
          {missing.length === 0 ? (
            <p className="text-sm text-green-600 flex items-center gap-1 mt-2">✓ All branches reported</p>
          ) : (
            <ul className="space-y-1">
              {missing.map((b, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-destructive">
                  <span className="w-2 h-2 rounded-full bg-destructive inline-block" />{b}
                </li>
              ))}
            </ul>
          )}
        </div>
      );
    }

    default:
      return <p className="text-sm text-muted-foreground">Unknown widget type</p>;
  }
}
