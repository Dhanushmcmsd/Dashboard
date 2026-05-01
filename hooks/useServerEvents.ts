"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QUERY_KEYS } from "@/lib/query-client";

export function useServerEvents() {
  const qc = useQueryClient();

  useEffect(() => {
    let es: EventSource;
    let retryTimeout: ReturnType<typeof setTimeout>;

    function connect() {
      es = new EventSource("/api/events");

      es.addEventListener("message", (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case "upload-complete":
              qc.invalidateQueries({ queryKey: ["daily-dashboard"] });
              qc.invalidateQueries({
                queryKey: QUERY_KEYS.BRANCH_DASHBOARD(data.branch),
              });
              break;

            case "dashboard-updated":
              qc.invalidateQueries({ queryKey: ["daily-dashboard"] });
              break;

            case "new-alert":
              toast.message(`Alert from ${data.sentByName}`, {
                description: data.message,
                duration: 8000,
              });
              qc.invalidateQueries({ queryKey: QUERY_KEYS.ALERTS });
              break;
          }
        } catch (err) {
          console.error("[SSE] parse error:", err);
        }
      });

      es.addEventListener("error", () => {
        es.close();
        // Exponential-free retry after 3s
        retryTimeout = setTimeout(connect, 3000);
      });
    }

    connect();

    return () => {
      clearTimeout(retryTimeout);
      es?.close();
    };
  }, [qc]);
}
