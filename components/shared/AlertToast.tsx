"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { getPusherClient } from "@/lib/pusher-client";
import { PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/constants";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/query-client";
import { AlertRecord } from "@/types";

export default function AlertToast() {
  const qc = useQueryClient();
  const seenAlerts = useRef(new Set<string>());

  useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher) return; // Pusher not configured, skip silently

    const channel = pusher.subscribe(PUSHER_CHANNELS.PRIVATE_ALERTS);

    channel.bind(PUSHER_EVENTS.NEW_ALERT, (data: AlertRecord) => {
      if (seenAlerts.current.has(data.id)) return;
      seenAlerts.current.add(data.id);

      setTimeout(() => {
        seenAlerts.current.delete(data.id);
      }, 120000);

      toast.message(`Alert from ${data.sentByName}`, {
        description: data.message,
        duration: 8000,
      });

      qc.invalidateQueries({ queryKey: QUERY_KEYS.ALERTS });
    });

    return () => {
      pusher.unsubscribe(PUSHER_CHANNELS.PRIVATE_ALERTS);
    };
  }, [qc]);

  return null;
}
