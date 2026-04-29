"use client";

import { useState } from "react";
import { useUsers, useUpdateUser } from "@/hooks/useUsers";
import { BRANCHES, UserRecord } from "@/types";
import { Loader2, Copy, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function UsersPage() {
  const { data: users, isLoading, refetch } = useUsers();
  const { mutateAsync: updateUser, isPending: isUpdating } = useUpdateUser();
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "ACTIVE">("ALL");
  const [setupLink, setSetupLink] = useState<{ userId: string; link: string } | null>(null);

  const pendingCount = users?.filter(u => !u.isActive).length || 0;

  const filteredUsers = users?.filter(u => {
    if (filter === "PENDING") return !u.isActive;
    if (filter === "ACTIVE") return u.isActive;
    return true;
  }) || [];

  const handleRoleChange = async (userId: string, role: string) => {
    try {
      await updateUser({ id: userId, data: { role: role as any } });
      toast.success("Role updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to update role");
    }
  };

  const handleBranchToggle = async (user: UserRecord, branch: string) => {
    try {
      let newBranches = [...user.branches];
      if (newBranches.includes(branch)) {
        newBranches = newBranches.filter(b => b !== branch);
      } else {
        newBranches.push(branch);
      }
      await updateUser({ id: user.id, data: { branches: newBranches } });
    } catch (err: any) {
      toast.error(err.message || "Failed to update branches");
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      await updateUser({ id: userId, data: { isActive: true } });
      toast.success("User approved");
    } catch (err: any) {
      toast.error(err.message || "Failed to approve user");
    }
  };

  const handleDeactivate = async (userId: string) => {
    if (!confirm("Are you sure you want to deactivate this user?")) return;
    try {
      // Soft delete endpoint
      await fetch(`/api/users/${userId}`, { method: "DELETE" });
      refetch();
      toast.success("User deactivated");
    } catch (err: any) {
      toast.error("Failed to deactivate user");
    }
  };

  const generateSetupLink = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}/set-password-link`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setSetupLink({ userId, link: data.data.link });
    } catch (err: any) {
      toast.error(err.message || "Failed to generate setup link");
    }
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success("Link copied to clipboard");
  };

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">User Management</h2>
          <p className="text-text-muted mt-1">Approve accounts and assign roles/branches.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-surface border border-border p-1 rounded-lg w-max">
        <button
          onClick={() => setFilter("ALL")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === "ALL" ? "bg-elevated text-white" : "text-text-muted hover:text-white"}`}
        >
          All Users
        </button>
        <button
          onClick={() => setFilter("PENDING")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${filter === "PENDING" ? "bg-elevated text-white" : "text-text-muted hover:text-white"}`}
        >
          Pending
          {pendingCount > 0 && (
            <span className="bg-warning text-warning-foreground text-[10px] px-1.5 py-0.5 rounded-full">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setFilter("ACTIVE")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === "ACTIVE" ? "bg-elevated text-white" : "text-text-muted hover:text-white"}`}
        >
          Active
        </button>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-text-muted uppercase bg-elevated border-b border-border">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Status & Password</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Assigned Branches</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-text-muted">
                    No users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-elevated/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-text-primary">{user.name}</div>
                      <div className="text-text-muted">{user.email}</div>
                      <div className="text-xs text-text-muted/60 mt-1">Joined {format(new Date(user.createdAt), "MMM d, yyyy")}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        {user.isActive ? (
                          <span className="flex w-max items-center text-xs text-success bg-success/10 px-2 py-1 rounded-full">
                            <span className="w-2 h-2 rounded-full bg-success animate-pulse mr-1.5" />
                            Active
                          </span>
                        ) : (
                          <span className="flex w-max items-center text-xs text-warning bg-warning/10 px-2 py-1 rounded-full">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Pending
                          </span>
                        )}
                        
                        {user.passwordSet ? (
                          <span className="flex w-max items-center text-xs text-text-muted bg-elevated px-2 py-1 rounded-full">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Pwd Set
                          </span>
                        ) : (
                          <span className="flex w-max items-center text-xs text-danger bg-danger/10 px-2 py-1 rounded-full">
                            No Pwd
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        disabled={!user.isActive || isUpdating}
                        className="bg-background border border-border text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2 disabled:opacity-50"
                      >
                        <option value="EMPLOYEE">EMPLOYEE</option>
                        <option value="MANAGEMENT">MANAGEMENT</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2 max-w-[250px]">
                        {BRANCHES.map(b => (
                          <label key={b} className="flex items-center space-x-1.5 text-xs">
                            <input
                              type="checkbox"
                              checked={user.branches.includes(b)}
                              onChange={() => handleBranchToggle(user, b)}
                              disabled={!user.isActive || user.role !== "EMPLOYEE" || isUpdating}
                              className="rounded border-border text-primary focus:ring-primary bg-background disabled:opacity-50"
                            />
                            <span className={!user.isActive || user.role !== "EMPLOYEE" ? "opacity-50" : "text-text-primary"}>
                              {b.replace(" Loan", "").replace("Supermarket", "SM")}
                            </span>
                          </label>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right space-y-2">
                      {!user.isActive ? (
                        <button
                          onClick={() => handleApprove(user.id)}
                          className="bg-success/10 hover:bg-success/20 text-success px-3 py-1.5 rounded-md text-xs font-medium transition-colors w-full"
                        >
                          Approve
                        </button>
                      ) : (
                        <>
                          {!user.passwordSet && (
                            <button
                              onClick={() => generateSetupLink(user.id)}
                              className="bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-md text-xs font-medium transition-colors w-full text-left"
                            >
                              Get setup link
                            </button>
                          )}
                          <button
                            onClick={() => handleDeactivate(user.id)}
                            className="bg-danger/10 hover:bg-danger/20 text-danger px-3 py-1.5 rounded-md text-xs font-medium transition-colors w-full text-left"
                          >
                            Deactivate
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Setup Link Modal */}
      {setupLink && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Setup Link Generated</h3>
            <p className="text-sm text-text-muted mb-4">
              Send this link to the employee. They will use it to set their password. It expires in 7 days.
            </p>
            <div className="flex items-center gap-2 mb-6">
              <input
                type="text"
                readOnly
                value={setupLink.link}
                className="w-full bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-text-primary"
              />
              <button
                onClick={() => copyLink(setupLink.link)}
                className="p-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors shrink-0"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => setSetupLink(null)}
              className="w-full bg-elevated hover:bg-elevated/80 text-white font-medium py-2 rounded-lg transition-colors border border-border"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
