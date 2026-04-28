// FILE: app/api/dashboard/daily/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateDailySnapshot } from "@/lib/generateDailySnapshot";
import { getTodayKey } from "@/lib/utils";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "MANAGEMENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const dateKey = getTodayKey();
    let snapshot = await prisma.dailySnapshot.findUnique({ where: { dateKey } });

    if (!snapshot) {
      snapshot = await generateDailySnapshot(dateKey);
    }

    return NextResponse.json({
      dateKey: snapshot.dateKey,
      combinedData: snapshot.combinedData,
      generatedAt: snapshot.generatedAt,
    });
  } catch (error) {
    console.error("Daily dashboard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
