import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { getMonthKey } from "@/lib/utils";
import { buildMonthlySnapshot } from "@/lib/snapshot-generator";

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(["MANAGEMENT"]);
    if (auth.error) {
      return errorResponse(auth.error, auth.status);
    }

    const { searchParams } = new URL(req.url);
    const monthKey = searchParams.get("month") || getMonthKey();

    let snapshot = await prisma.monthlySnapshot.findUnique({
      where: { monthKey },
    });

    if (!snapshot) {
      const combinedData = await buildMonthlySnapshot(monthKey);
      return successResponse(combinedData);
    }

    return successResponse(snapshot.combinedData);
  } catch (error) {
    console.error("Monthly dashboard error:", error);
    return errorResponse("Internal server error", 500);
  }
}
