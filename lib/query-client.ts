"use client";
import { QueryClient } from "@tanstack/react-query";
export function makeQueryClient() { return new QueryClient({ defaultOptions: { queries: { staleTime: 60000, retry: 1 } } }); }
let browserClient: QueryClient | undefined;
export function getQueryClient() { if (typeof window === "undefined") return makeQueryClient(); if (!browserClient) browserClient = makeQueryClient(); return browserClient; }
export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> { const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } }); const json = await res.json(); if (!res.ok || !json.success) throw new Error(json.error ?? "Request failed"); return json.data as T; }
export const QUERY_KEYS = { users: () => ["users"] as const, dashboardDaily: (dateKey?: string) => ["dashboard", "daily", dateKey] as const, dashboardMonthly: (monthKey?: string) => ["dashboard", "monthly", monthKey] as const, dashboardBranch: (branch: string) => ["dashboard", "branch", branch] as const, alerts: () => ["alerts"] as const, uploadHistory: () => ["uploads", "history"] as const };
