// FILE: app/api/dashboard/monthly/route.ts

import { NextRequest } from "next/server";
import { unstable_cache } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  errorResponse,
  parseSearchParams,
  successResponse,
  validationErrorResponse,
} from "@/lib/api-utils";
import { MonthlyDashboardQuerySchema } from "@/lib/validations";
import { HTTP_STATUS } from "@/lib/constants";
import type { MonthlyDashboardData, BranchMonthlyMetric } from "@/types";

function getPrevMonth(yyyyMm: string): string {
  const [y, m] = yyyyMm.split("-").map(Number);
  const d = new Date(y, m - 2, 1); // month is 0-indexed
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function calcGrowth(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return parseFloat((((current - previous) / previous) * 100).toFixed(2));
}

const getMonthlyData = unstable_cache(
  async (month: string, branchId?: string): Promise<MonthlyDashboardData> => {
    const [year, mon] = month.split("-").map(Number);
    const startDate = new Date(year, mon - 1, 1);
    const endDate = new Date(year, mon, 0, 23, 59, 59, 999);

    const prevMonth = getPrevMonth(month);
    const [prevYear, prevMon] = prevMonth.split("-").map(Number);
    const prevStart = new Date(prevYear, prevMon - 1, 1);
    const prevEnd = new Date(prevYear, prevMon, 0, 23, 59, 59, 999);

    const branchWhere = branchId ? { branchId } : {};

    // Single query — no N+1
    const [currentRows, previousRows] = await Promise.all([
      prisma.monthlyMetric.findMany({
        where: { ...branchWhere, month: { gte: startDate, lte: endDate } },
        select: {
          id: true,
          month: true,
          closingBalance: true,
          disbursement: true,
          collection: true,
          npa: true,
          branch: { select: { id: true, name: true } },
          dpdBuckets: { select: { bucket: true, count: true, amount: true } },
        },
        orderBy: { branch: { name: "asc" } },
      }),
      prisma.monthlyMetric.findMany({
        where: { ...branchWhere, month: { gte: prevStart, lte: prevEnd } },
        select: {
          closingBalance: true,
          branch: { select: { id: true } },
        },
      }),
    ]);

    const prevBalanceByBranch = new Map(
      previousRows.map((r) => [r.branch.id, r.closingBalance])
    );

    const branches: BranchMonthlyMetric[] = currentRows.map((m) => {
      const prev = prevBalanceByBranch.get(m.branch.id) ?? 0;
      const growth = calcGrowth(m.closingBalance, prev);
      return {
        branchId: m.branch.id,
        branchName: m.branch.name as BranchMonthlyMetric["branchName"],
        month: m.month.toISOString(),
        closingBalance: m.closingBalance,
        disbursement: m.disbursement,
        collection: m.collection,
        npa: m.npa,
        growthPercent: growth,
        trend:
          growth === null ? "neutral" : growth > 0 ? "up" : growth < 0 ? "down" : "neutral",
        dpdBuckets: m.dpdBuckets.map((d) => ({
          bucket: d.bucket as BranchMonthlyMetric["dpdBuckets"][0]["bucket"],
          count: d.count,
          amount: d.amount,
        })),
      };
    });

    const totals = branches.reduce(
      (acc, b) => ({
        closingBalance: acc.closingBalance + b.closingBalance,
        disbursement: acc.disbursement + b.disbursement,
        collection: acc.collection + b.collection,
        npa: acc.npa + b.npa,
      }),
      { closingBalance: 0, disbursement: 0, collection: 0, npa: 0 }
    );

    return {
      month,
      lastUpdated: new Date().toISOString(),
      branches,
      totals,
    };
  },
  ["monthly-dashboard"],
  { revalidate: 600 } // 10 minutes
);

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return errorResponse("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const parsed = parseSearchParams(request.nextUrl.searchParams, MonthlyDashboardQuerySchema);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const { month, branchId } = parsed.data;
    const now = new Date();
    const targetMonth =
      month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const effectiveBranchId =
      session.user.role === "BRANCH_MANAGER"
        ? (session.user.branchId ?? undefined)
        : branchId;

    const data = await getMonthlyData(targetMonth, effectiveBranchId);
    return successResponse(data);
  } catch (err) {
    console.error("[GET /api/dashboard/monthly]", err);
    return errorResponse("Failed to fetch monthly dashboard data");
  }
}
