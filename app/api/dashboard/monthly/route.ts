import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { buildMonthlySnapshot } from "@/lib/snapshot-generator";
import { getMonthKey } from "@/lib/utils";
import type { SessionUser, MonthlyDashboardData } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as SessionUser).role !== "MANAGEMENT") return errorResponse("Forbidden", 403);
    const monthKey = req.nextUrl.searchParams.get("month") ?? getMonthKey(new Date());
    const snapshot = await prisma.monthlySnapshot.findUnique({ where: { monthKey } });
    const data: MonthlyDashboardData = snapshot ? (snapshot.combinedData as unknown as MonthlyDashboardData) : await buildMonthlySnapshot(monthKey);
    return successResponse(data);
  } catch { return errorResponse("Failed to fetch monthly dashboard"); }
}
