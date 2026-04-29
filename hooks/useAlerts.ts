import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS, apiFetch } from "@/lib/query-client";
import { AlertRecord } from "@/types";

export function useAlerts() {
  return useQuery({
    queryKey: QUERY_KEYS.ALERTS,
    queryFn: () => apiFetch<AlertRecord[]>("/api/alerts"),
  });
}

export function useSendAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (message: string) =>
      apiFetch<AlertRecord>("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: QUERY_KEYS.ALERTS });
    },
  });
}
