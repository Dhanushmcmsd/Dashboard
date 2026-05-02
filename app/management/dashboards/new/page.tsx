"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { WidgetCanvas } from "@/components/dashboard-builder/WidgetCanvas";
import { ExportButton } from "@/components/dashboard-builder/ExportButton";
import type { DashboardState } from "@/lib/types";
import { toast } from "sonner";
import { Save } from "lucide-react";

const INITIAL_STATE: DashboardState = {
  id: null,
  name: "Untitled Dashboard",
  layout: [],
  widgets: [],
  isShared: false,
  isDirty: false,
};

export default function NewDashboardPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<DashboardState>(INITIAL_STATE);
  const [saving, setSaving] = useState(false);
  const [editingName, setEditingName] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/dashboards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: state.name,
          layout: state.layout,
          widgets: state.widgets,
          isShared: state.isShared,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const created = await res.json();
      toast.success("Dashboard saved!");
      router.push(`/management/dashboards/${created.id}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save dashboard");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-background sticky top-0 z-10">
        <div className="flex items-center gap-3">
          {editingName ? (
            <input
              autoFocus
              className="text-lg font-semibold border-b border-primary bg-transparent focus:outline-none px-1 py-0.5"
              value={state.name}
              onChange={(e) => setState((s) => ({ ...s, name: e.target.value }))}
              onBlur={() => setEditingName(false)}
              onKeyDown={(e) => e.key === "Enter" && setEditingName(false)}
            />
          ) : (
            <h1
              className="text-lg font-semibold cursor-pointer hover:text-primary transition-colors"
              onClick={() => setEditingName(true)}
              title="Click to rename"
            >
              {state.name}
            </h1>
          )}
        </div>
        <div className="flex items-center gap-3">
          <ExportButton canvasRef={canvasRef} dashboardName={state.name} />
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={state.isShared}
              onChange={(e) => setState((s) => ({ ...s, isShared: e.target.checked }))}
            />
            Share with team
          </label>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            <Save size={15} />{saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div ref={canvasRef} className="flex-1 overflow-auto p-4">
        <WidgetCanvas
          dashboardId={null}
          isShared={false}
          initialState={state}
          onSave={setState}
        />
      </div>
    </div>
  );
}
