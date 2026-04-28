"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, QUERY_KEYS } from "@/lib/query-client";
import type { AlertRecord } from "@/types";

export default function AlertsPage() {
  const qc = useQueryClient();
  const [msg, setMsg] = useState("");
  const { data: alerts = [] } = useQuery({ queryKey: QUERY_KEYS.alerts(), queryFn: () => apiFetch<AlertRecord[]>("/api/alerts") });
  const send = useMutation({ mutationFn: (message: string) => apiFetch("/api/alerts", { method: "POST", body: JSON.stringify({ message }) }), onSuccess: () => { qc.invalidateQueries({ queryKey: QUERY_KEYS.alerts() }); setMsg(""); } });
  return <div><h1 className="text-xl font-bold mb-4">Alerts</h1><textarea value={msg} onChange={(e) => setMsg(e.target.value)} className="w-full max-w-xl h-24 bg-surface border border-border rounded p-2" /><button onClick={() => msg.trim() && send.mutate(msg.trim())} className="ml-2 bg-primary text-white px-4 py-2 rounded">Send</button><div className="mt-6 space-y-2">{alerts.map((a) => <div key={a.id} className="bg-surface border border-border rounded p-2">{a.message}</div>)}</div></div>;
}
