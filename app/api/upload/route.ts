import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { getTodayKey, getMonthKey } from "@/lib/utils";
import { parseExcelBuffer } from "@/lib/excel-parser";
import { parseHtmlContent } from "@/lib/html-parser";
import { buildDailySnapshot } from "@/lib/snapshot-generator";
import { pusherServer, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher-server";
import rateLimit from "@/lib/rate-limit";
import { Prisma } from "@prisma/client";

const limiter = rateLimit({ interval: 60000, uniqueTokenPerInterval: 500 });

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    try {
      await limiter.check(10, ip);
    } catch {
      return errorResponse("Rate limit exceeded. Try again later.", 429);
    }

    const auth = await requireAuth(["EMPLOYEE"]);
    if (auth.error) {
      return errorResponse(auth.error, auth.status);
    }

    const user = auth.user;
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const branch = formData.get("branch") as string;

    if (!file || !branch) {
      return errorResponse("File and branch are required", 400);
    }

    if (!user.branches.includes(branch)) {
      return errorResponse("You are not assigned to this branch", 403);
    }

    if (file.size > 5 * 1024 * 1024) {
      return errorResponse("File size exceeds 5MB limit", 400);
    }

    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");
    const isHtml = fileName.endsWith(".html") || fileName.endsWith(".htm");

    if (!isExcel && !isHtml) {
      return errorResponse("Only Excel and HTML files are allowed", 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    let parsedData = null;
    let htmlContent = null;

    if (isExcel) {
      const rows = parseExcelBuffer(arrayBuffer);
      // We assume the employee uploads a file containing their branch
      const branchRow = rows.find(r => r.branch.toLowerCase() === branch.toLowerCase());
      if (!branchRow) {
        return errorResponse("Could not find data for the selected branch in the file", 400);
      }
      parsedData = branchRow;
    } else {
      htmlContent = buffer.toString("utf-8");
      parsedData = parseHtmlContent(htmlContent);
      if (parsedData.branch.toLowerCase() !== branch.toLowerCase()) {
         // Optionally force branch to be the selected one if parsing is fuzzy
         parsedData.branch = branch as any;
      }
    }

    const dateKey = getTodayKey();
    const monthKey = getMonthKey();

    const upload = await prisma.upload.create({
      data: {
        branch,
        fileType: isExcel ? "EXCEL" : "HTML",
        fileName: file.name,
        rawData: parsedData as unknown as Prisma.InputJsonValue,
        htmlContent: htmlContent,
        uploadedBy: user.id,
        dateKey,
        monthKey,
      },
    });

    // Fire events and build snapshot in background to avoid blocking response
    Promise.all([
      buildDailySnapshot(dateKey).catch(console.error),
      pusherServer.trigger(PUSHER_CHANNELS.PRIVATE_UPLOADS, PUSHER_EVENTS.UPLOAD_COMPLETE, {
        branch,
        dateKey,
        uploadedBy: user.name
      }),
      pusherServer.trigger(PUSHER_CHANNELS.PRIVATE_DASHBOARD, PUSHER_EVENTS.DASHBOARD_UPDATED, {
        dateKey
      })
    ]).catch(console.error);

    return successResponse({ success: true, message: "File uploaded successfully" });
  } catch (error) {
    console.error("Upload error:", error);
    return errorResponse("Internal server error", 500);
  }
}
