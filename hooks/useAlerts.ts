"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, QUERY_KEYS } from "@/lib/query-client";
import type { AlertRecord } from "@/types";

export function useAlerts() { return useQuery({ queryKey: QUERY_KEYS.alerts(), queryFn: () => apiFetch<AlertRecord[]>("/api/alerts"), staleTime: 30000 }); }
export function useSendAlert() { const qc = useQueryClient(); return useMutation({ mutationFn: (message: string) => apiFetch("/api/alerts", { method: "POST", body: JSON.stringify({ message }) }), onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.alerts() }) }); }
