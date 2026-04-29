import { NextResponse } from "next/server";
import { buildDailySnapshot } from "@/lib/snapshot-generator";
import { getTodayKey } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dateKey = getTodayKey();
    const snapshot = await buildDailySnapshot(dateKey);

    return NextResponse.json({
      success: true,
      dateKey: snapshot.dateKey,
      missingBranches: snapshot.missingBranches,
    });
  } catch (error) {
    console.error("Daily reset cron error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
