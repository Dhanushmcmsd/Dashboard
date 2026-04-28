import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { HTTP_STATUS, UPLOAD_LIMITS, PUSHER_CHANNELS, PUSHER_EVENTS, BRANCHES } from "@/lib/constants";
import { parseExcelBuffer } from "@/lib/excel-parser";
import { parseHtmlContent } from "@/lib/html-parser";
import { buildDailySnapshot } from "@/lib/snapshot-generator";
import { getTodayKey, getMonthKey } from "@/lib/utils";
import { pusherServer } from "@/lib/pusher-server";
import type { BranchName, SessionUser } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return errorResponse("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    const user = session.user as SessionUser;
    if (user.role !== "EMPLOYEE") return errorResponse("Forbidden", HTTP_STATUS.FORBIDDEN);
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const branch = formData.get("branch") as string | null;
    if (!file || !branch) return errorResponse("file and branch are required", HTTP_STATUS.BAD_REQUEST);
    if (!BRANCHES.includes(branch as BranchName)) return errorResponse("Invalid branch", HTTP_STATUS.BAD_REQUEST);
    if (!user.branches.includes(branch)) return errorResponse("Not assigned to this branch", HTTP_STATUS.FORBIDDEN);
    if (file.size > UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES) return errorResponse("File too large (max 10MB)", HTTP_STATUS.BAD_REQUEST);
    const isExcel = UPLOAD_LIMITS.ALLOWED_EXCEL_TYPES.some((t) => t === file.type);
    const isHtml = UPLOAD_LIMITS.ALLOWED_HTML_TYPES.some((t) => t === file.type) || file.name.endsWith(".html");
    if (!isExcel && !isHtml) return errorResponse("Only Excel or HTML files are allowed", HTTP_STATUS.BAD_REQUEST);
    const dateKey = getTodayKey();
    const monthKey = getMonthKey();
    let rawData: object | null = null;
    let htmlContent: string | null = null;
    if (isExcel) {
      const rows = parseExcelBuffer(await file.arrayBuffer());
      const row = rows.find((r) => r.branch === branch) ?? rows[0];
      rawData = { ...row, branch };
    } else {
      htmlContent = await file.text();
      rawData = { ...parseHtmlContent(htmlContent), branch };
    }
    const dbUser = await prisma.user.findUnique({ where: { email: user.email }, select: { id: true } });
    if (!dbUser) return errorResponse("User not found", HTTP_STATUS.UNAUTHORIZED);
    await prisma.upload.create({ data: { branch, fileType: isExcel ? "EXCEL" : "HTML", fileName: file.name, rawData, htmlContent, uploadedBy: dbUser.id, dateKey, monthKey } });
    buildDailySnapshot(dateKey).then(() => { pusherServer.trigger(PUSHER_CHANNELS.UPLOADS, PUSHER_EVENTS.UPLOAD_COMPLETE, { branch, dateKey }); pusherServer.trigger(PUSHER_CHANNELS.DASHBOARD, PUSHER_EVENTS.DASHBOARD_UPDATED, { dateKey }); }).catch(console.error);
    return successResponse({ uploaded: true, branch, dateKey }, HTTP_STATUS.CREATED);
  } catch { return errorResponse("Upload failed"); }
}
