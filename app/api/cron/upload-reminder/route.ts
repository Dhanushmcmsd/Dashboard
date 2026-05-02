import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendUploadReminderEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Get all unique branches from the User model
    const allUsers = await prisma.user.findMany({
      where: { isActive: true, role: "EMPLOYEE" },
      select: { id: true, name: true, email: true, branches: true },
    });

    // Collect all unique branch names
    const allBranches = [
      ...new Set(allUsers.flatMap((u) => u.branches)),
    ];

    const results: { branch: string; email: string }[] = [];

    for (const branch of allBranches) {
      // Check if this branch has uploaded today
      const hasUpload = await prisma.upload.findFirst({
        where: {
          branch,
          uploadedAt: { gte: today },
        },
      });

      if (hasUpload) continue;

      // Find employees assigned to this branch
      const branchEmployees = allUsers.filter((u) =>
        u.branches.includes(branch)
      );

      for (const emp of branchEmployees) {
        await sendUploadReminderEmail(
          emp.email,
          emp.name ?? "",
          branch,
          "5:00 PM IST"
        );
        results.push({ branch, email: emp.email });
      }

      // Log to AuditLog — use the first employee as the actor, or skip userId with a system user
      if (branchEmployees.length > 0) {
        await prisma.auditLog.create({
          data: {
            userId: branchEmployees[0].id,
            action: "REMINDER_SENT",
            resource: "Upload",
            metadata: {
              branch,
              recipients: branchEmployees.map((e) => e.email),
            },
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      sent: results.length,
      details: results,
    });
  } catch (error) {
    console.error("Upload reminder cron error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
