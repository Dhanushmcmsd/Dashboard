import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendDailySummaryEmail } from "@/lib/email";
import { getTodayKey } from "@/lib/utils";
import { DailyDashboardData } from "@/types";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const dateKey = getTodayKey();

    const snapshot = await prisma.dailySnapshot.findUnique({
      where: { dateKey },
    });

    if (!snapshot) {
      return NextResponse.json({
        message: "No snapshot found for today — no branches have uploaded yet.",
        sent: 0,
      });
    }

    const data = snapshot.combinedData as unknown as DailyDashboardData;

    // Get all active MANAGEMENT users
    const managers = await prisma.user.findMany({
      where: { isActive: true, role: "MANAGEMENT" },
      select: { id: true, name: true, email: true },
    });

    if (managers.length === 0) {
      return NextResponse.json({ message: "No active management users found.", sent: 0 });
    }

    const results: string[] = [];
    for (const manager of managers) {
      await sendDailySummaryEmail(manager.email, manager.name ?? "", data);
      results.push(manager.email);
    }

    // Audit log — use first manager as actor
    await prisma.auditLog.create({
      data: {
        userId: managers[0].id,
        action: "DAILY_SUMMARY_SENT",
        resource: "DailySnapshot",
        resourceId: snapshot.id,
        metadata: {
          dateKey,
          recipients: results,
          branchCount: data.branches.length,
          missingBranches: data.missingBranches,
        },
      },
    });

    return NextResponse.json({
      success: true,
      sent: results.length,
      recipients: results,
      dateKey,
    });
  } catch (error) {
    console.error("Daily summary email cron error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
