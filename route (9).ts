// FILE: app/api/dashboard/daily/route.ts

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
import { DashboardQuerySchema } from "@/lib/validations";
import { BRANCHES, HTTP_STATUS } from "@/lib/constants";
import type { DailyDashboardData, BranchDailyMetric } from "@/types";

// ─── Cached DB fetcher ────────────────────────────────────────────────────────
const getDailyData = unstable_cache(
  async (date: string, branchId?: string): Promise<DailyDashboardData> => {
    const where = {
      date: new Date(date),
      ...(branchId ? { branchId } : {}),
    };

    const metrics = await prisma.dailyMetric.findMany({
      where,
      select: {
        id: true,
        date: true,
        closingBalance: true,
        disbursement: true,
        collection: true,
        npa: true,
        branch: { select: { id: true, name: true } },
        dpdBuckets: {
          select: { bucket: true, count: true, amount: true },
        },
      },
      orderBy: { branch: { name: "asc" } },
    });

    if (metrics.length === 0) {
      return {
        date,
        lastUpdated: new Date().toISOString(),
        topBranch: null,
        branches: [],
        totals: { closingBalance: 0, disbursement: 0, collection: 0, npa: 0 },
      };
    }

    const branches: BranchDailyMetric[] = metrics.map((m) => ({
      branchId: m.branch.id,
      branchName: m.branch.name as BranchDailyMetric["branchName"],
      closingBalance: m.closingBalance,
      disbursement: m.disbursement,
      collection: m.collection,
      npa: m.npa,
      date: m.date.toISOString(),
      dpdBuckets: m.dpdBuckets.map((d) => ({
        bucket: d.bucket as DailyDashboardData["branches"][0]["dpdBuckets"][0]["bucket"],
        count: d.count,
        amount: d.amount,
      })),
    }));

    const topBranch =
      branches.length > 0
        ? branches.reduce((best, b) =>
            b.closingBalance > best.closingBalance ? b : best
          ).branchName
        : null;

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
      date,
      lastUpdated: new Date().toISOString(),
      topBranch,
      branches,
      totals,
    };
  },
  ["daily-dashboard"],
  { revalidate: 120 } // 2 minutes
);

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return errorResponse("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const parsed = parseSearchParams(request.nextUrl.searchParams, DashboardQuerySchema);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const { date, branchId } = parsed.data;
    const targetDate = date ?? new Date().toISOString().split("T")[0];

    // Branch managers can only see their own branch
    const effectiveBranchId =
      session.user.role === "BRANCH_MANAGER"
        ? (session.user.branchId ?? undefined)
        : branchId;

    const data = await getDailyData(targetDate, effectiveBranchId);
    return successResponse(data);
  } catch (err) {
    console.error("[GET /api/dashboard/daily]", err);
    return errorResponse("Failed to fetch daily dashboard data");
  }
}
