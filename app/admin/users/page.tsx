"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch, QUERY_KEYS } from "@/lib/query-client";
import { BRANCHES } from "@/lib/constants";
import type { UserRecord } from "@/types";

type Tab = "all" | "pending" | "active";
type AdminUserRecord = UserRecord & { passwordSet?: boolean };

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-main">User Management</h1>
          <p className="text-text-muted text-sm mt-0.5">{users.length} total accounts</p>
        </div>
      </div>

      {setupLink && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSetupLink(null)}>
          <div className="bg-surface border border-border rounded-2xl p-6 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-text-main font-bold mb-1">Password Setup Link</h3>
            <p className="text-text-muted text-sm mb-4">Share this link with the user. It expires in 7 days.</p>
            <div className="flex gap-2">
              <input
                readOnly
                value={setupLink.link}
                className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-text-main text-xs font-mono focus:outline-none"
              />
              <button
                onClick={() => copyLink(setupLink.link)}
                className="bg-primary hover:bg-primary/90 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
              >
                Copy
              </button>
            </div>
            <button onClick={() => setSetupLink(null)} className="mt-4 text-text-muted text-sm hover:text-text-main transition">
              Close
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-1 mb-4 bg-surface border border-border rounded-xl p-1 w-fit">
        {(["all", "pending", "active"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition capitalize ${
              tab === t ? "bg-primary text-white" : "text-text-muted hover:text-text-main"
            }`}
          >
            {t}{t === "pending" && pendingCount > 0 ? ` (${pendingCount})` : ""}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-text-muted text-sm animate-pulse">Loading users...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-8 text-center text-text-muted text-sm">
          {tab === "pending" ? "No pending approvals" : "No users found"}
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {["User", "Role", "Branches", "Status", "Password", "Actions"].map((h) => (
                  <th key={h} className="text-left text-text-muted text-xs uppercase tracking-wider font-medium px-4 py-3 bg-background/30 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-t border-border/50 hover:bg-border/10 transition">
                  <td className="px-4 py-3">
                    <div className="font-medium text-text-main">{u.name}</div>
                    <div className="text-text-muted text-xs">{u.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      disabled={!u.isActive}
                      onChange={(e) => patchUser.mutate({ id: u.id, patch: { role: e.target.value } })}
                      className="bg-background border border-border rounded-lg px-2 py-1.5 text-text-main text-xs focus:outline-none focus:border-primary disabled:opacity-40"
                    >
                      <option value="EMPLOYEE">Employee</option>
                      <option value="MANAGEMENT">Management</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1 max-w-[220px]">
                      {BRANCHES.map((b) => (
                        <label key={b} className={`flex items-center gap-1 text-xs cursor-pointer ${!u.isActive ? "opacity-40" : ""}`}>
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
                            className="accent-primary"
                          />
                          <span className="text-text-muted leading-tight">{b}</span>
                        </label>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {u.isActive ? (
                      <span className="bg-success/15 text-success text-xs font-medium px-2.5 py-1 rounded-full">Active</span>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        <span className="bg-warning/15 text-warning text-xs font-medium px-2.5 py-1 rounded-full w-fit">Pending</span>
                        <button
                          onClick={() => patchUser.mutate({ id: u.id, patch: { isActive: true } })}
                          className="text-xs bg-success/10 hover:bg-success/20 text-success font-medium px-2.5 py-1 rounded-lg transition w-fit"
                        >
                          Approve
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {u.passwordSet ? (
                      <span className="text-text-muted text-xs">Set</span>
                    ) : u.isActive ? (
                      <span className="bg-warning/15 text-warning text-xs font-medium px-2 py-0.5 rounded-full">Not set</span>
                    ) : (
                      <span className="text-text-muted text-xs opacity-40">Pending</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1.5">
                      {u.isActive && !u.passwordSet && (
                        <button
                          onClick={() => getSetupLink(u.id)}
                          className="text-xs bg-primary/10 hover:bg-primary/20 text-primary font-medium px-2.5 py-1.5 rounded-lg transition whitespace-nowrap"
                        >
                          Get setup link
                        </button>
                      )}
                      {u.isActive && (
                        <button
                          onClick={() => patchUser.mutate({ id: u.id, patch: { isActive: false } })}
                          className="text-xs text-danger/70 hover:text-danger transition"
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
