import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { buildMonthlySnapshot } from "@/lib/snapshot-generator";
import { getMonthKey } from "@/lib/utils";

export async function POST(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return errorResponse("Unauthorized", 401);
  try {
    const monthKey = getMonthKey();
    const data = await buildMonthlySnapshot(monthKey);
    return successResponse({ monthKey, branchCount: data.branches.length });
  } catch { return errorResponse("Cron monthly-reset failed"); }
}
