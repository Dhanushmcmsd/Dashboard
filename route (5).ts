// FILE: app/api/dashboard/generate-monthly/route.ts
import { NextRequest, NextResponse } from "next/server";
import { generateMonthlySnapshot } from "@/lib/generateMonthlySnapshot";
import { getMonthKey } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const monthKey = getMonthKey();
    await generateMonthlySnapshot(monthKey);
    return NextResponse.json({ success: true, monthKey });
  } catch (error) {
    console.error("Generate monthly snapshot error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
