import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { buildDailySnapshot } from "@/lib/snapshot-generator";
import { getTodayKey } from "@/lib/utils";

export async function POST(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return errorResponse("Unauthorized", 401);
  try {
    const dateKey = getTodayKey();
    const data = await buildDailySnapshot(dateKey);
    return successResponse({ dateKey, missingBranches: data.missingBranches });
  } catch { return errorResponse("Cron daily-reset failed"); }
}
