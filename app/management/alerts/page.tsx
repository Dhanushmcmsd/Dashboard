"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch, QUERY_KEYS } from "@/lib/query-client";
import { getPusherClient } from "@/lib/pusher-client";
import { PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/constants";
import type { AlertRecord } from "@/types";

export default function AlertsPage() {
  const qc = useQueryClient();
  const [msg, setMsg] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.alerts(),
    queryFn: () => apiFetch<AlertRecord[]>("/api/alerts"),
  });

  const sendMutation = useMutation({
    mutationFn: (message: string) =>
      apiFetch("/api/alerts", { method: "POST", body: JSON.stringify({ message }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.alerts() });
      setMsg("");
      toast.success("Alert broadcast to all online users");
    },
    onError: () => toast.error("Failed to send alert"),
  });

  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe(PUSHER_CHANNELS.ALERTS);
    channel.bind(PUSHER_EVENTS.NEW_ALERT, () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.alerts() });
    });
    return () => {
      channel.unbind_all();
      pusher.unsubscribe(PUSHER_CHANNELS.ALERTS);
    };
  }, [qc]);

  function handleSend() {
    const trimmed = msg.trim();
    if (!trimmed || sendMutation.isPending) return;
    sendMutation.mutate(trimmed);
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-main">Alerts</h1>
        <p className="text-text-muted text-sm mt-0.5">Broadcast messages to all online team members in real time.</p>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-5 mb-6">
        <label className="block text-xs font-medium uppercase tracking-wider text-text-muted mb-2">
          Broadcast message
        </label>
        <textarea
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSend();
          }}
          rows={3}
          maxLength={1000}
          placeholder="Type your alert message... (Ctrl+Enter to send)"
          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text-main text-sm resize-none focus:outline-none focus:border-primary transition"
        />
        <div className="flex items-center justify-between mt-3">
          <span className="text-text-muted text-xs">{msg.length}/1000 · Ctrl+Enter to send</span>
          <button
            onClick={handleSend}
            disabled={!msg.trim() || sendMutation.isPending}
            className="bg-primary hover:bg-primary/90 text-white text-sm font-semibold px-5 py-2 rounded-lg transition disabled:opacity-40 flex items-center gap-2"
          >
            {sendMutation.isPending ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sending...
              </>
            ) : "Send Alert"}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-medium uppercase tracking-wider text-text-muted">Recent alerts</h2>
        {alerts.length > 0 && <span className="text-xs text-text-muted">{alerts.length} total</span>}
      </div>

      {isLoading ? (
        <div className="text-text-muted text-sm animate-pulse">Loading...</div>
      ) : alerts.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-8 text-center">
          <span className="text-3xl block mb-2">🔕</span>
          <p className="text-text-muted text-sm">No alerts sent yet.</p>
        </div>
      ) : (
        <div ref={listRef} className="space-y-2 max-h-[60vh] overflow-y-auto">
          {alerts.map((a, i) => (
            <div key={a.id} className="bg-surface border border-border rounded-xl px-4 py-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0 mt-0.5">
                {a.sentByName[0]?.toUpperCase() ?? "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-text-main text-sm leading-relaxed">{a.message}</p>
                <p className="text-text-muted text-xs mt-1.5">
                  <span className="font-medium text-text-main">{a.sentByName}</span>
                  {" · "}
                  {new Date(a.sentAt).toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              {i === 0 && (
                <span className="bg-primary/15 text-primary text-xs font-medium px-2 py-0.5 rounded-full shrink-0">
                  Latest
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
