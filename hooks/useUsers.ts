import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS, apiFetch } from "@/lib/query-client";
import { UserRecord } from "@/types";

export function useUsers() {
  return useQuery({
    queryKey: QUERY_KEYS.USERS,
    queryFn: () => apiFetch<UserRecord[]>("/api/users"),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<UserRecord> }) =>
      apiFetch<UserRecord>(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: QUERY_KEYS.USERS });
    },
  });
}
