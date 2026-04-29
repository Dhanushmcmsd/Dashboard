"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch, QUERY_KEYS } from "@/lib/query-client";
import { BRANCHES } from "@/lib/constants";
import type { UserRecord } from "@/types";

type Tab = "all" | "pending" | "active";
type AdminUserRecord = UserRecord & { passwordSet?: boolean };

const ROLE_BADGE = {
  ADMIN: "badge-admin",
  MANAGEMENT: "badge-management",
  EMPLOYEE: "badge-employee",
};

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("all");
  const [setupLink, setSetupLink] = useState<{ userId: string; link: string } | null>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.users(),
    queryFn: () => apiFetch<AdminUserRecord[]>("/api/users"),
  });

  const patchUser = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Record<string, unknown> }) =>
      apiFetch(`/api/users/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.users() });
      toast.success("User updated");
    },
    onError: () => toast.error("Update failed"),
  });

  async function getSetupLink(userId: string) {
    try {
      const res = await apiFetch<{ link: string }>(`/api/users/${userId}/set-password-link`);
      setSetupLink({ userId, link: res.link });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to generate link");
    }
  }

  async function copyLink(link: string) {
    await navigator.clipboard.writeText(link);
    toast.success("Link copied to clipboard");
  }

  const filtered = users.filter((u) => {
    if (tab === "pending") return !u.isActive;
    if (tab === "active") return u.isActive;
    return true;
  });
  const pendingCount = users.filter((u) => !u.isActive).length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "#E2E8F0" }}>
            User Management
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>
            {users.length} total accounts
          </p>
        </div>
      </div>

      {/* Setup link modal */}
      {setupLink && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={() => setSetupLink(null)}
        >
          <div
            className="relative max-w-lg w-full rounded-2xl p-6"
            style={{
              background: "#111116",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)" }}
            />
            <h3 className="font-semibold mb-1" style={{ color: "#E2E8F0" }}>Password Setup Link</h3>
            <p className="text-sm mb-4" style={{ color: "#64748B" }}>
              Share this link with the user. It expires in 7 days.
            </p>
            <div className="flex gap-2">
              <input
                readOnly
                value={setupLink.link}
                className="flex-1 rounded-lg px-3 py-2 text-xs font-mono outline-none"
                style={{
                  background: "#0F0F14",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#E2E8F0",
                }}
              />
              <button
                onClick={() => copyLink(setupLink.link)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
                style={{ background: "#2563EB" }}
              >
                Copy
              </button>
            </div>
            <button
              onClick={() => setSetupLink(null)}
              className="mt-4 text-sm transition-colors"
              style={{ color: "#64748B" }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div
        className="flex gap-1 mb-5 p-1 rounded-xl w-fit"
        style={{ background: "#111116", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        {(["all", "pending", "active"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize"
            style={
              tab === t
                ? { background: "#2563EB", color: "#fff" }
                : { color: "#64748B" }
            }
          >
            {t}{t === "pending" && pendingCount > 0 ? ` (${pendingCount})` : ""}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-sm animate-pulse" style={{ color: "#64748B" }}>Loading users...</div>
      ) : filtered.length === 0 ? (
        <div
          className="rounded-xl p-10 text-center text-sm"
          style={{
            background: "#111116",
            border: "1px solid rgba(255,255,255,0.06)",
            color: "#64748B",
          }}
        >
          {tab === "pending" ? "No pending approvals" : "No users found"}
        </div>
      ) : (
        <div
          className="rounded-xl overflow-x-auto"
          style={{
            background: "#111116",
            border: "1px solid rgba(255,255,255,0.06)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
          }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                {["User", "Role", "Branches", "Status", "Password", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3.5 text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                    style={{ color: "#64748B", background: "#18181F" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, idx) => (
                <tr
                  key={u.id}
                  style={{
                    borderTop: idx > 0 ? "1px solid rgba(255,255,255,0.03)" : "none",
                    background: idx % 2 === 0 ? "#111116" : "#0F0F14",
                  }}
                >
                  {/* User info */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                        style={{
                          background: u.isActive ? "rgba(37,99,235,0.15)" : "rgba(100,116,139,0.15)",
                          color: u.isActive ? "#60A5FA" : "#94A3B8",
                        }}
                      >
                        {u.name[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium" style={{ color: "#E2E8F0" }}>{u.name}</div>
                        <div className="text-xs" style={{ color: "#64748B" }}>{u.email}</div>
                      </div>
                    </div>
                  </td>

                  {/* Role selector */}
                  <td className="px-5 py-3.5">
                    <select
                      value={u.role}
                      disabled={!u.isActive}
                      onChange={(e) => patchUser.mutate({ id: u.id, patch: { role: e.target.value } })}
                      className="rounded-lg px-2 py-1.5 text-xs outline-none transition-all disabled:opacity-40"
                      style={{
                        background: "#0F0F14",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "#E2E8F0",
                      }}
                    >
                      <option value="EMPLOYEE">Employee</option>
                      <option value="MANAGEMENT">Management</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                    <div className="mt-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        u.role === "ADMIN"
                          ? "text-red-400 bg-red-500/10"
                          : u.role === "MANAGEMENT"
                          ? "text-blue-400 bg-blue-500/10"
                          : "text-slate-400 bg-slate-500/10"
                      }`}>
                        {u.role.toLowerCase()}
                      </span>
                    </div>
                  </td>

                  {/* Branches */}
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {BRANCHES.map((b) => (
                        <label
                          key={b}
                          className={`flex items-center gap-1 text-xs cursor-pointer ${!u.isActive ? "opacity-40" : ""}`}
                        >
                          <input
                            type="checkbox"
                            disabled={!u.isActive}
                            checked={u.branches.includes(b)}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? [...u.branches, b]
                                : u.branches.filter((x) => x !== b);
                              patchUser.mutate({ id: u.id, patch: { branches: next } });
                            }}
                            className="accent-blue-500 w-3 h-3"
                          />
                          <span style={{ color: "#94A3B8" }}>{b}</span>
                        </label>
                      ))}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-3.5">
                    {u.isActive ? (
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full pulse-dot"
                          style={{ background: "#16A34A" }}
                        />
                        <span className="text-xs font-medium" style={{ color: "#4ADE80" }}>Active</span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ background: "#D97706" }} />
                          <span className="text-xs font-medium" style={{ color: "#FCD34D" }}>Pending</span>
                        </div>
                        <button
                          onClick={() => patchUser.mutate({ id: u.id, patch: { isActive: true } })}
                          className="text-xs px-2.5 py-1 rounded-lg transition-all font-medium w-fit"
                          style={{
                            background: "rgba(22,163,74,0.1)",
                            color: "#4ADE80",
                            border: "1px solid rgba(22,163,74,0.2)",
                          }}
                        >
                          Approve
                        </button>
                      </div>
                    )}
                  </td>

                  {/* Password */}
                  <td className="px-5 py-3.5">
                    {u.passwordSet ? (
                      <span className="text-xs" style={{ color: "#64748B" }}>Set</span>
                    ) : u.isActive ? (
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{
                          background: "rgba(217,119,6,0.1)",
                          color: "#FCD34D",
                          border: "1px solid rgba(217,119,6,0.2)",
                        }}
                      >
                        Not set
                      </span>
                    ) : (
                      <span className="text-xs opacity-40" style={{ color: "#64748B" }}>—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3.5">
                    <div className="flex flex-col gap-1.5">
                      {u.isActive && !u.passwordSet && (
                        <button
                          onClick={() => getSetupLink(u.id)}
                          className="text-xs px-2.5 py-1.5 rounded-lg transition-all font-medium whitespace-nowrap"
                          style={{
                            background: "rgba(37,99,235,0.1)",
                            color: "#60A5FA",
                            border: "1px solid rgba(37,99,235,0.2)",
                          }}
                        >
                          Get setup link
                        </button>
                      )}
                      {u.isActive && (
                        <button
                          onClick={() => patchUser.mutate({ id: u.id, patch: { isActive: false } })}
                          className="text-xs px-2.5 py-1 rounded-lg transition-all font-medium whitespace-nowrap"
                          style={{ color: "#F87171" }}
                        >
                          Deactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
