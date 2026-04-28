"use client";
import { useQuery } from "@tanstack/react-query";
import { apiFetch, QUERY_KEYS } from "@/lib/query-client";
import type { UserRecord } from "@/types";

export default function UsersPage() {
  const { data = [], isLoading } = useQuery({ queryKey: QUERY_KEYS.users(), queryFn: () => apiFetch<UserRecord[]>("/api/users") });
  if (isLoading) return <div>Loading users...</div>;
  return <div><h1 className="text-xl font-bold mb-4">User Management</h1><div className="space-y-2">{data.map((u) => <div key={u.id} className="bg-surface border border-border rounded p-3 text-sm">{u.name} - {u.email} - {u.role}</div>)}</div></div>;
}
