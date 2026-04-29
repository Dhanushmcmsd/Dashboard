"use client";

import { useState } from "react";
import { useAlerts, useSendAlert } from "@/hooks/useAlerts";
import { Send, Loader2, Bell, Clock } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function AlertsPage() {
  const { data: alerts, isLoading } = useAlerts();
  const { mutateAsync: sendAlert, isPending } = useSendAlert();
  const [message, setMessage] = useState("");

  const handleSend = async () => {
    if (!message.trim()) return;
    try {
      await sendAlert(message.trim());
      setMessage("");
      toast.success("Alert sent successfully to all online users");
    } catch (err: any) {
      toast.error(err.message || "Failed to send alert");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Compose Section */}
      <div className="lg:col-span-1 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Send Alert</h2>
          <p className="text-sm text-text-muted">
            Broadcast a real-time notification to all users currently online in the dashboard.
          </p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
          <div className="mb-4">
            <label className="block text-sm font-medium text-text-primary mb-2">
              Message <span className="text-danger">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter your urgent message here..."
              className="w-full bg-elevated border border-border rounded-lg p-3 text-sm text-text-primary min-h-[120px] resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-text-muted/50"
              maxLength={1000}
            />
            <div className="flex justify-between items-center mt-2 text-xs">
              <span className="text-text-muted">Press <kbd className="bg-elevated px-1.5 py-0.5 rounded border border-border font-sans">Ctrl + Enter</kbd> to send</span>
              <span className={`font-medium ${message.length > 900 ? "text-warning" : "text-text-muted"}`}>
                {message.length} / 1000
              </span>
            </div>
          </div>

          <button
            onClick={handleSend}
            disabled={!message.trim() || isPending}
            className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Broadcast Alert
              </>
            )}
          </button>
        </div>
      </div>

      {/* History Section */}
      <div className="lg:col-span-2">
        <div className="bg-surface border border-border rounded-xl h-full flex flex-col max-h-[calc(100vh-12rem)]">
          <div className="p-6 border-b border-border bg-elevated/30 flex items-center justify-between">
            <h3 className="text-lg font-medium text-text-primary flex items-center gap-2">
              <Clock className="w-5 h-5 text-text-muted" />
              Alert History
            </h3>
            {alerts && alerts.length > 0 && (
              <span className="text-xs bg-surface border border-border px-2 py-1 rounded text-text-muted">
                Last 50 alerts
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : !alerts || alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <Bell className="w-12 h-12 text-text-muted opacity-30 mb-4" />
                <p className="text-text-muted">No alerts have been sent yet.</p>
              </div>
            ) : (
              alerts.map((alert, index) => (
                <div 
                  key={alert.id} 
                  className={`p-4 rounded-xl border relative transition-colors ${
                    index === 0 ? "bg-primary/5 border-primary/20" : "bg-elevated/50 border-border"
                  }`}
                >
                  {index === 0 && (
                    <span className="absolute -top-2.5 right-4 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                      Latest
                    </span>
                  )}
                  
                  <div className="flex gap-4">
                    <div className="shrink-0 w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center font-bold text-text-primary">
                      {alert.sentByName.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
                        <span className="font-semibold text-text-primary truncate pr-2">{alert.sentByName}</span>
                        <span className="text-xs text-text-muted whitespace-nowrap">
                          {formatDistanceToNow(new Date(alert.sentAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-text-primary/90 whitespace-pre-wrap leading-relaxed">
                        {alert.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
