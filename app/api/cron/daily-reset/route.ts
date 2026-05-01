import { NextResponse } from "next/server";
import { buildDailySnapshot } from "@/lib/snapshot-generator";
import { getTodayKey } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { sendDailyStatusEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dateKey = getTodayKey();
    const snapshot = await buildDailySnapshot(dateKey);

    // Feature 7: notify all active admins about upload status
    try {
      const combinedData = snapshot.combinedData as any;
      const uploadedBranches: string[] = combinedData?.uploadedBranches ?? [];
      const missingBranches: string[] = snapshot.missingBranches ?? [];

      const admins = await prisma.user.findMany({
        where: { role: "ADMIN", isActive: true },
        select: { email: true, name: true },
      });

      await Promise.all(
        admins.map((admin) =>
          sendDailyStatusEmail(admin.email, admin.name, {
            dateKey,
            uploadedBranches,
            missingBranches,
            totalUploaded: uploadedBranches.length,
            totalBranches: uploadedBranches.length + missingBranches.length,
          })
        )
      );
    } catch (emailErr) {
      // Email errors must never break the cron response
      console.error("[daily-reset] Failed to send status emails:", emailErr);
    }

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
