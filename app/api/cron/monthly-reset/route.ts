import { NextResponse } from "next/server";
import { buildMonthlySnapshot } from "@/lib/snapshot-generator";
import { getMonthKey } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const monthKey = getMonthKey();
    const snapshot = await buildMonthlySnapshot(monthKey);

    return NextResponse.json({
      success: true,
      monthKey: snapshot.monthKey,
      branchCount: snapshot.branches.length,
    });
  } catch (error) {
    console.error("Monthly reset cron error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
