"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { getPusherClient } from "@/lib/pusher-client";
import { PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/constants";
import { QUERY_KEYS } from "@/lib/query-client";
import type { AlertRecord } from "@/types";

export default function AlertToast() {
  const qc = useQueryClient();
  const seenRef = useRef(new Set<string>());

  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe(PUSHER_CHANNELS.ALERTS);

    channel.bind(PUSHER_EVENTS.NEW_ALERT, (alert: AlertRecord) => {
      if (seenRef.current.has(alert.id)) return;
      seenRef.current.add(alert.id);
      setTimeout(() => seenRef.current.delete(alert.id), 120_000);

      qc.invalidateQueries({ queryKey: QUERY_KEYS.alerts() });
      toast.info(`Alert: ${alert.message}`, {
        description: `From ${alert.sentByName}`,
        duration: 10_000,
      });
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(PUSHER_CHANNELS.ALERTS);
    };
  }, [qc]);

  return null;
}
