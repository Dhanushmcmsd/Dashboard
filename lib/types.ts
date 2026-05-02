import { z } from "zod";

// ---------------------------------------------------------------------------
// Grid position — mirrors react-grid-layout's Layout item
// ---------------------------------------------------------------------------
export interface GridPosition {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

// ---------------------------------------------------------------------------
// Widget types
// ---------------------------------------------------------------------------
export const WIDGET_TYPES = [
  "kpi_card",
  "bar_chart",
  "line_chart",
  "pie_chart",
  "dpd_buckets",
  "branch_table",
  "gauge",
  "missing_branches",
] as const;

export type WidgetType = (typeof WIDGET_TYPES)[number];

export const DATA_SOURCES = ["daily_snapshot", "monthly_snapshot"] as const;
export type DataSource = (typeof DATA_SOURCES)[number];

// ---------------------------------------------------------------------------
// Zod schema for a single widget config
// ---------------------------------------------------------------------------
export const WidgetConfigSchema = z.object({
  id: z.string().min(1),
  type: z.enum(WIDGET_TYPES),
  title: z.string().min(1).max(80),
  dataSource: z.enum(DATA_SOURCES),
  metric: z.string().optional(),
  dateRange: z
    .object({
      from: z.string().optional(), // ISO date string
      to: z.string().optional(),
    })
    .optional(),
  filters: z
    .object({
      branchIds: z.array(z.string()).optional(),
    })
    .optional(),
});

export type WidgetConfig = z.infer<typeof WidgetConfigSchema>;

// ---------------------------------------------------------------------------
// Zod schema for the full dashboard layout (POST/PUT body)
// ---------------------------------------------------------------------------
export const DashboardLayoutSchema = z.object({
  name: z.string().min(1).max(100),
  layout: z.array(
    z.object({
      i: z.string(),
      x: z.number().int().min(0),
      y: z.number().int().min(0),
      w: z.number().int().min(1).max(12),
      h: z.number().int().min(1),
    })
  ),
  widgets: z.array(WidgetConfigSchema),
  isShared: z.boolean().optional().default(false),
});

export type DashboardLayoutInput = z.infer<typeof DashboardLayoutSchema>;

// ---------------------------------------------------------------------------
// Dashboard state used in the builder UI
// ---------------------------------------------------------------------------
export interface DashboardState {
  id: string | null; // null = unsaved
  name: string;
  layout: GridPosition[];
  widgets: WidgetConfig[];
  isShared: boolean;
  isDirty: boolean;
}

// ---------------------------------------------------------------------------
// API response shapes
// ---------------------------------------------------------------------------
export interface DashboardListItem {
  id: string;
  name: string;
  isShared: boolean;
  widgetCount: number;
  updatedAt: string;
  owner: {
    id: string;
    name: string;
  };
}

export interface DashboardDetail extends DashboardListItem {
  layout: GridPosition[];
  widgets: WidgetConfig[];
}
