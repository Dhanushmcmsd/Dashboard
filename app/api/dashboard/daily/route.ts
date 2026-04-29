import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { getTodayKey } from "@/lib/utils";
import { buildDailySnapshot } from "@/lib/snapshot-generator";

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(["MANAGEMENT"]);
    if (auth.error) {
      return errorResponse(auth.error, auth.status);
    }

    const { searchParams } = new URL(req.url);
    const dateKey = searchParams.get("date") || getTodayKey();

    let snapshot = await prisma.dailySnapshot.findUnique({
      where: { dateKey },
    });

    if (!snapshot) {
      try {
        const combinedData = await buildDailySnapshot(dateKey);
        return successResponse(combinedData);
      } catch (e: any) {
        if (e.message === "Snapshot is already being built") {
          return errorResponse("Snapshot is currently being generated. Please try again in a moment.", 503);
        }
        throw e;
      }
    }

    return successResponse(snapshot.combinedData);
  } catch (error) {
    console.error("Daily dashboard error:", error);
    return errorResponse("Internal server error", 500);
  }
}
