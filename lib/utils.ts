import { format, subMonths } from "date-fns";
import { formatInTimeZone, toDate } from "date-fns-tz";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const IST_TIMEZONE = "Asia/Kolkata";

export function getTodayKey(): string {
  return formatInTimeZone(new Date(), IST_TIMEZONE, "yyyy-MM-dd");
}

export function getMonthKey(date?: Date): string {
  const targetDate = date || new Date();
  return formatInTimeZone(targetDate, IST_TIMEZONE, "yyyy-MM");
}

export function getPrevMonthKey(monthKey: string): string {
  // monthKey is "YYYY-MM"
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  const prevMonth = subMonths(date, 1);
  return format(prevMonth, "yyyy-MM");
}

export function formatINR(amount: number): string {
  return amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });
}

export function formatINRFull(amount: number): string {
  return amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatINRCompact(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)}Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)}L`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(2)}K`;
  }
  return `₹${amount.toFixed(2)}`;
}

export function calcGrowth(current: number, prev: number): number | null {
  if (prev === 0) return null;
  return Number((((current - prev) / prev) * 100).toFixed(2));
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
