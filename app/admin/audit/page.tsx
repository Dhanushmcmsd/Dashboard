"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/query-client";
import { format } from "date-fns";
import {
  ScrollText,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCcw,
} from "lucide-react";

const ALL_ACTIONS = [
  "UPLOAD_CREATED",
  "UPLOAD_DELETED",
  "USER_CREATED",
  "USER_UPDATED",
  "USER_DELETED",
  "ROLE_CHANGED",
  "USER_LOGIN",
  "USER_LOGOUT",
  "PASSWORD_CHANGED",
  "SNAPSHOT_GENERATED",
  "ALERT_SENT",
] as const;

const ACTION_BADGE: Record<string, string> = {
  UPLOAD_CREATED:     "bg-success/10 text-success border-success/20",
  UPLOAD_DELETED:     "bg-danger/10 text-danger border-danger/20",
  USER_CREATED:       "bg-success/10 text-success border-success/20",
  USER_UPDATED:       "bg-blue-500/10 text-blue-400 border-blue-500/20",
  USER_DELETED:       "bg-danger/10 text-danger border-danger/20",
  ROLE_CHANGED:       "bg-amber-500/10 text-amber-400 border-amber-500/20",
  USER_LOGIN:         "bg-blue-500/10 text-blue-400 border-blue-500/20",
  USER_LOGOUT:        "bg-surface text-text-muted border-border",
  PASSWORD_CHANGED:   "bg-amber-500/10 text-amber-400 border-amber-500/20",
  SNAPSHOT_GENERATED: "bg-surface text-text-muted border-border",
  ALERT_SENT:         "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

function metadataSummary(metadata: Record<string, unknown>): string {
  if (!metadata || typeof metadata !== "object") return "";
  return Object.entries(metadata)
    .map(([k, v]) => `${k}: ${v}`)
    .join(" · ");
}

interface AuditEntry {
  id: string;
  action: string;
  resource: string;
  resourceId: string | null;
  metadata: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: string;
  user: { name: string; email: string };
}

interface AuditResponse {
  logs: AuditEntry[];
  total: number;
  page: number;
  totalPages: number;
}

export default function AuditLogPage() {
  const [page, setPage]           = useState(1);
  const [actionFilter, setAction] = useState("");
  const [emailSearch, setEmail]   = useState("");

  const buildUrl = () => {
    const params = new URLSearchParams({ page: String(page), limit: "25" });
    if (actionFilter) params.set("action", actionFilter);
    return `/api/audit?${params.toString()}`;
  };

  const { data, isLoading, isError, refetch } = useQuery<AuditResponse>({
    queryKey: ["audit-logs", page, actionFilter],
    queryFn:  () => apiFetch<AuditResponse>(buildUrl()),
  });

  // client-side email filter on the loaded page
  const logs = (data?.logs ?? []).filter((l) =>
    emailSearch
      ? l.user.email.toLowerCase().includes(emailSearch.toLowerCase())
      : true
  );

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold text-text-primary flex items-center gap-3">
          <ScrollText className="w-6 h-6 text-text-muted" />
          Audit Log
        </h2>
        <p className="text-sm text-text-muted mt-1">
          A chronological record of every significant action taken in BranchSync.
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3">
        <select
          value={actionFilter}
          onChange={(e) => { setAction(e.target.value); setPage(1); }}
          className="bg-elevated border border-border text-text-primary text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary/50"
        >
          <option value="">All Actions</option>
          {ALL_ACTIONS.map((a) => (
            <option key={a} value={a}>{a.replace(/_/g, " ")}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search by email…"
          value={emailSearch}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-elevated border border-border text-text-primary text-sm rounded-lg px-3 py-2 w-56 focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-text-muted"
        />

        <button
          onClick={() => refetch()}
          className="ml-auto flex items-center gap-1.5 px-3 py-2 bg-elevated border border-border text-text-muted hover:text-text-primary text-sm rounded-lg transition-colors"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-7 h-7 animate-spin text-primary" />
        </div>
      ) : isError ? (
        <div className="bg-danger/10 border border-danger/20 rounded-xl p-8 text-center">
          <p className="text-danger font-medium">Failed to load audit logs.</p>
          <button onClick={() => refetch()} className="mt-4 px-4 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary hover:bg-elevated transition-colors">
            Try Again
          </button>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-16 text-center">
          <ScrollText className="w-14 h-14 text-text-muted mx-auto mb-4 opacity-40" />
          <h3 className="text-lg font-medium text-text-primary mb-1">No Logs Found</h3>
          <p className="text-text-muted text-sm">Try adjusting the filters above.</p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-text-muted uppercase bg-elevated border-b border-border">
                <tr>
                  <th className="px-5 py-3.5">Timestamp</th>
                  <th className="px-5 py-3.5">User</th>
                  <th className="px-5 py-3.5">Action</th>
                  <th className="px-5 py-3.5">Resource</th>
                  <th className="px-5 py-3.5">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-elevated/40 transition-colors">
                    <td className="px-5 py-3 text-text-muted text-xs whitespace-nowrap">
                      {format(new Date(log.createdAt), "MMM d, yyyy h:mm a")}
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-text-primary text-xs">{log.user.name}</p>
                      <p className="text-text-muted text-[11px]">{log.user.email}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded border ${
                        ACTION_BADGE[log.action] ?? "bg-surface text-text-muted border-border"
                      }`}>
                        {log.action.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-text-muted">
                      {log.resource}
                      {log.resourceId && (
                        <span className="ml-1 text-[11px] text-text-muted/60">#{log.resourceId.slice(-6)}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-text-muted text-xs max-w-xs truncate" title={metadataSummary(log.metadata)}>
                      {metadataSummary(log.metadata) || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-elevated/30">
              <p className="text-xs text-text-muted">
                Showing {(page - 1) * 25 + 1}–{Math.min(page * 25, data.total)} of {data.total} entries
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-border bg-elevated hover:bg-border disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-text-muted" />
                </button>
                <span className="text-xs text-text-muted px-2">
                  {page} / {data.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                  className="p-1.5 rounded-lg border border-border bg-elevated hover:bg-border disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-text-muted" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
