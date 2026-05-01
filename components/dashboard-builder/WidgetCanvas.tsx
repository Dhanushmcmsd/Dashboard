"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Responsive, WidthProvider, Layout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { Plus } from "lucide-react";
import type { DashboardState, GridPosition, WidgetConfig } from "@/lib/types";
import { WidgetRenderer } from "./WidgetRenderer";
import { WidgetSidebar } from "./WidgetSidebar";
import { WidgetConfigPanel } from "./WidgetConfigPanel";

const ResponsiveGridLayout = WidthProvider(Responsive);

interface WidgetCanvasProps {
  dashboardId: string | null;
  isShared: boolean;
  initialState: DashboardState;
  onSave?: (state: DashboardState) => void;
}

export function WidgetCanvas({ dashboardId, isShared, initialState, onSave }: WidgetCanvasProps) {
  const [state, setState] = useState<DashboardState>(initialState);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [configWidget, setConfigWidget] = useState<WidgetConfig | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced persist to DB
  const persistLayout = useCallback(
    (newState: DashboardState) => {
      if (isShared || !dashboardId) return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        try {
          await fetch(`/api/dashboards/${dashboardId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: newState.name,
              layout: newState.layout,
              widgets: newState.widgets,
              isShared: newState.isShared,
            }),
          });
          onSave?.({ ...newState, isDirty: false });
        } catch (err) {
          console.error("[WidgetCanvas] Failed to persist layout", err);
        }
      }, 500);
    },
    [dashboardId, isShared, onSave]
  );

  useEffect(() => () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); }, []);

  const handleLayoutChange = (newLayout: Layout[]) => {
    if (isShared) return;
    const mapped: GridPosition[] = newLayout.map((l) => ({
      i: l.i, x: l.x, y: l.y, w: l.w, h: l.h,
    }));
    const updated: DashboardState = { ...state, layout: mapped, isDirty: true };
    setState(updated);
    persistLayout(updated);
  };

  const addWidget = (widget: WidgetConfig) => {
    const newPos: GridPosition = { i: widget.id, x: 0, y: Infinity, w: 4, h: 3 };
    const updated: DashboardState = {
      ...state,
      widgets: [...state.widgets, widget],
      layout: [...state.layout, newPos],
      isDirty: true,
    };
    setState(updated);
    persistLayout(updated);
  };

  const removeWidget = (widgetId: string) => {
    const updated: DashboardState = {
      ...state,
      widgets: state.widgets.filter((w) => w.id !== widgetId),
      layout: state.layout.filter((l) => l.i !== widgetId),
      isDirty: true,
    };
    setState(updated);
    persistLayout(updated);
  };

  const updateWidgetConfig = (updated: WidgetConfig) => {
    const updatedState: DashboardState = {
      ...state,
      widgets: state.widgets.map((w) => (w.id === updated.id ? updated : w)),
      isDirty: true,
    };
    setState(updatedState);
    persistLayout(updatedState);
    setConfigWidget(null);
  };

  if (state.widgets.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-muted-foreground">
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="30" width="45" height="35" rx="6" stroke="currentColor" strokeWidth="2" strokeDasharray="5 3" />
            <rect x="65" y="30" width="45" height="35" rx="6" stroke="currentColor" strokeWidth="2" strokeDasharray="5 3" />
            <rect x="10" y="75" width="100" height="25" rx="6" stroke="currentColor" strokeWidth="2" strokeDasharray="5 3" />
          </svg>
          <p className="text-lg font-medium">No widgets yet</p>
          <p className="text-sm">Click the + button to add your first widget</p>
          {!isShared && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <Plus size={16} /> Add Widget
            </button>
          )}
        </div>
        {sidebarOpen && (
          <WidgetSidebar onAdd={addWidget} onClose={() => setSidebarOpen(false)} />
        )}
      </>
    );
  }

  return (
    <div className="relative">
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: state.layout, md: state.layout, sm: state.layout, xs: state.layout }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4 }}
        rowHeight={80}
        margin={[16, 16]}
        draggableHandle=".widget-drag-handle"
        onLayoutChange={handleLayoutChange}
        isDraggable={!isShared}
        isResizable={!isShared}
      >
        {state.widgets.map((widget) => (
          <div key={widget.id} className="bg-card border rounded-xl shadow-sm overflow-hidden">
            <WidgetRenderer
              config={widget}
              isShared={isShared}
              onConfigure={() => setConfigWidget(widget)}
              onDelete={() => removeWidget(widget.id)}
            />
          </div>
        ))}
      </ResponsiveGridLayout>

      {!isShared && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed bottom-8 right-8 w-12 h-12 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition-all hover:scale-110 z-50"
          title="Add widget"
        >
          <Plus size={22} />
        </button>
      )}

      {sidebarOpen && <WidgetSidebar onAdd={addWidget} onClose={() => setSidebarOpen(false)} />}
      {configWidget && (
        <WidgetConfigPanel
          widget={configWidget}
          onApply={updateWidgetConfig}
          onClose={() => setConfigWidget(null)}
        />
      )}
    </div>
  );
}
