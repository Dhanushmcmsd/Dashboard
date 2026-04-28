import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, QUERY_KEYS } from "@/lib/query-client";
import type { UserRecord } from "@/types";

export function useUsers() { return useQuery({ queryKey: QUERY_KEYS.users(), queryFn: () => apiFetch<UserRecord[]>("/api/users") }); }
export function useUpdateUser() { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, patch }: { id: string; patch: Partial<UserRecord> }) => apiFetch(`/api/users/${id}`, { method: "PATCH", body: JSON.stringify(patch) }), onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.users() }) }); }
