// FILE: hooks/useAlerts.ts

import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch, QUERY_KEYS } from "@/lib/query-client";
import { getPusherClient } from "@/lib/pusher-client";
import { PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher-server";
import type { Alert } from "@/types";

interface AlertsParams {
  page?: number;
  limit?: number;
  severity?: "INFO" | "WARNING" | "CRITICAL";
  unreadOnly?: boolean;
}

interface AlertsResponse {
  alerts: Alert[];
  total: number;
  unreadCount: number;
}

export function useAlerts(params: AlertsParams = {}) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.severity) searchParams.set("severity", params.severity);
  if (params.unreadOnly) searchParams.set("unreadOnly", "true");

  return useQuery({
    queryKey: QUERY_KEYS.alerts(params),
    queryFn: () =>
      apiFetch<AlertsResponse>(`/api/alerts?${searchParams.toString()}`),
    staleTime: 30 * 1000,
  });
}

export function useRealTimeAlerts() {
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof getPusherClient>["subscribe"] extends (...args: infer A) => infer R ? R : never>(null);

  useEffect(() => {
    const pusher = getPusherClient();

    // Unsubscribe if already subscribed to prevent duplicate listeners
    if (channelRef.current) {
      channelRef.current.unbind_all();
    }

    const channel = pusher.subscribe(PUSHER_CHANNELS.ALERTS);
    channelRef.current = channel as typeof channelRef.current;

    const seenIds = new Set<string>();

    channel.bind(PUSHER_EVENTS.NEW_ALERT, (alert: Alert) => {
      // Event deduplication on client side
      if (seenIds.has(alert.id)) return;
      seenIds.add(alert.id);
      // Clean up old seen IDs after 60 seconds
      setTimeout(() => seenIds.delete(alert.id), 60_000);

      queryClient.invalidateQueries({ queryKey: ["alerts"] });

      const toastFn =
        alert.severity === "CRITICAL"
          ? toast.error
          : alert.severity === "WARNING"
            ? toast.warning
            : toast.info;

      toastFn(alert.message, {
        description: alert.branchName ?? undefined,
        duration: alert.severity === "CRITICAL" ? 10_000 : 5_000,
      });
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(PUSHER_CHANNELS.ALERTS);
    };
  }, [queryClient]);
}

export function useMarkAlertsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertIds: string[]) =>
      apiFetch("/api/alerts/read", {
        method: "PATCH",
        body: JSON.stringify({ alertIds }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
    onError: () => {
      toast.error("Failed to mark alerts as read");
    },
  });
}
