// FILE: app/api/cron/daily-reset/route.ts
import { NextRequest, NextResponse } from "next/server";
import { generateDailySnapshot } from "@/lib/generateDailySnapshot";
import { getTodayKey } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const dateKey = getTodayKey();
    await generateDailySnapshot(dateKey);
    return NextResponse.json({ success: true, dateKey });
  } catch (error) {
    console.error("Cron daily-reset error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
