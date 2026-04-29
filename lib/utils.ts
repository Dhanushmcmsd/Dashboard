import { format, toZonedTime } from "date-fns-tz";

const IST = "Asia/Kolkata";
export function getTodayKey(): string { return format(toZonedTime(new Date(), IST), "yyyy-MM-dd"); }
export function getMonthKey(date: Date = new Date()): string { return format(toZonedTime(date, IST), "yyyy-MM"); }
export function getPrevMonthKey(monthKey: string): string { const [y, m] = monthKey.split("-").map(Number); const date = new Date(y, m - 2, 1, 12, 0, 0); return format(toZonedTime(date, IST), "yyyy-MM"); }
export function formatINR(amount: number): string { return amount.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }); }
export function formatINRCompact(amount: number): string { if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`; if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`; if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`; return `₹${amount}`; }
export function calcGrowth(current: number, prev: number): number | null { if (prev === 0) return null; return parseFloat((((current - prev) / prev) * 100).toFixed(2)); }
export function cn(...classes: (string | undefined | false | null)[]): string { return classes.filter(Boolean).join(" "); }
