// FILE: app/api/dashboard/monthly/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateMonthlySnapshot } from "@/lib/generateMonthlySnapshot";
import { getMonthKey } from "@/lib/utils";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "MANAGEMENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const monthKey = getMonthKey();
    let snapshot = await prisma.monthlySnapshot.findUnique({ where: { monthKey } });

    if (!snapshot) {
      snapshot = await generateMonthlySnapshot(monthKey);
    }

    return NextResponse.json({
      monthKey: snapshot.monthKey,
      combinedData: snapshot.combinedData,
      generatedAt: snapshot.generatedAt,
    });
  } catch (error) {
    console.error("Monthly dashboard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
