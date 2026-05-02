"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { WidgetCanvas } from "@/components/dashboard-builder/WidgetCanvas";
import { ExportButton } from "@/components/dashboard-builder/ExportButton";
import type { DashboardState } from "@/lib/types";
import { toast } from "sonner";
import { Share2, Copy, Trash2 } from "lucide-react";

interface Props {
  initialState: DashboardState;
  isOwner: boolean;
  isManagement: boolean;
  ownerName: string;
}

export default function DashboardViewClient({ initialState, isOwner, isManagement, ownerName }: Props) {
  const router = useRouter();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<DashboardState>(initialState);
  const [toggling, setToggling] = useState(false);

  const isShared = !isOwner && initialState.isShared;

  const handleToggleShare = async () => {
    if (!isOwner) return;
    setToggling(true);
    try {
      const res = await fetch(`/api/dashboards/${state.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...state, isShared: !state.isShared }),
      });
      if (!res.ok) throw new Error();
      setState((s) => ({ ...s, isShared: !s.isShared }));
      toast.success(`Dashboard is now ${!state.isShared ? "shared" : "private"}`);
    } catch {
      toast.error("Failed to update sharing");
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this dashboard? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/dashboards/${state.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Dashboard deleted");
      router.push("/management/dashboards");
    } catch {
      toast.error("Failed to delete dashboard");
    }
  };

  const handleClone = async () => {
    try {
      const res = await fetch("/api/dashboards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${state.name} (copy)`,
          layout: state.layout,
          widgets: state.widgets,
          isShared: false,
        }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      toast.success("Dashboard cloned to your account");
      router.push(`/management/dashboards/${created.id}`);
    } catch {
      toast.error("Failed to clone dashboard");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-3 border-b bg-background sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">{state.name}</h1>
          {isShared && (
            <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
              <Share2 size={10} /> Shared by {ownerName}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <ExportButton canvasRef={canvasRef} dashboardName={state.name} />
          {isShared && isManagement && (
            <button
              onClick={handleClone}
              className="flex items-center gap-2 px-3 py-2 text-sm border rounded-md hover:bg-muted transition-colors"
            >
              <Copy size={14} /> Clone to My Dashboards
            </button>
          )}
          {isOwner && (
            <>
              <button
                onClick={handleToggleShare}
                disabled={toggling}
                className="flex items-center gap-2 px-3 py-2 text-sm border rounded-md hover:bg-muted transition-colors disabled:opacity-50"
              >
                <Share2 size={14} />
                {state.isShared ? "Make Private" : "Share"}
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-3 py-2 text-sm text-destructive border border-destructive/30 rounded-md hover:bg-destructive/10 transition-colors"
              >
                <Trash2 size={14} /> Delete
              </button>
            </>
          )}
        </div>
      </div>

      <div ref={canvasRef} className="flex-1 overflow-auto p-4">
        <WidgetCanvas
          dashboardId={state.id}
          isShared={isShared}
          initialState={state}
          onSave={setState}
        />
      </div>
    </div>
  );
}
