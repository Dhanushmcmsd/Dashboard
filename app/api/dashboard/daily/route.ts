import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { buildDailySnapshot } from "@/lib/snapshot-generator";
import { getTodayKey } from "@/lib/utils";
import type { SessionUser, DailyDashboardData } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as SessionUser).role !== "MANAGEMENT") return errorResponse("Forbidden", 403);
    const dateKey = req.nextUrl.searchParams.get("date") ?? getTodayKey();
    const snapshot = await prisma.dailySnapshot.findUnique({ where: { dateKey } });
    const data: DailyDashboardData = snapshot ? (snapshot.combinedData as unknown as DailyDashboardData) : await buildDailySnapshot(dateKey);
    return successResponse(data);
  } catch { return errorResponse("Failed to fetch daily dashboard"); }
}
