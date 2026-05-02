import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { getTodayKey, getMonthKey } from "@/lib/utils";
import { parseExcelBuffer, mergeReports } from "@/lib/excel-parser";
import { parseHtmlContent } from "@/lib/html-parser";
import { buildDailySnapshot } from "@/lib/snapshot-generator";
import { publishEvent } from "@/lib/events";
import rateLimit from "@/lib/rate-limit";
import { createAuditLog } from "@/lib/audit";
import { BranchName, ParsedRow } from "@/types";
import { Prisma } from "@prisma/client";

const limiter = rateLimit({ interval: 60000 });

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    try {
      await limiter.check(10, ip);
    } catch {
      return errorResponse("Rate limit exceeded. Try again later.", 429);
    }

    const auth = await requireAuth(["EMPLOYEE"]);
    if (auth.error || !auth.user) {
      return errorResponse(auth.error || "Unauthorized", auth.status || 401);
    }

    const user = auth.user!;
    const formData = await req.formData();
    const file   = formData.get("file")   as File;
    const branch = formData.get("branch") as string;

    if (!file || !branch) {
      return errorResponse("File and branch are required", 400);
    }

    if (!user.branches.includes(branch)) {
      return errorResponse("You are not assigned to this branch", 403);
    }

    if (file.size > 10 * 1024 * 1024) {
      return errorResponse("File size exceeds 10MB limit", 400);
    }

    const fileName = file.name.toLowerCase();
    const isExcel  = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");
    const isHtml   = fileName.endsWith(".html") || fileName.endsWith(".htm");

    if (!isExcel && !isHtml) {
      return errorResponse("Only Excel and HTML files are allowed", 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer      = Buffer.from(arrayBuffer);

    let parsedData: ParsedRow;
    let htmlContent: string | null = null;

    if (isExcel) {
      parsedData = await parseExcelBuffer(arrayBuffer, branch as BranchName);
    } else {
      htmlContent = buffer.toString("utf-8");
      const html  = parseHtmlContent(htmlContent);
      if (html.branch.toLowerCase() !== branch.toLowerCase()) {
        html.branch = branch as BranchName;
      }
      parsedData = html;
    }

    const dateKey  = getTodayKey();
    const monthKey = getMonthKey();

    // ── For Gold Loan Excel: support dual-report upload (merge if a record already exists today) ──
    let uploadId: string;

    if (isExcel && branch === "Gold Loan") {
      const existing = await prisma.upload.findFirst({
        where: { branch, dateKey, fileType: "EXCEL" },
        orderBy: { uploadedAt: "desc" },
      });

      if (existing) {
        // Merge the two parsed reports
        const existingParsed = existing.rawData as unknown as ParsedRow;
        const merged = mergeReports(existingParsed, parsedData);

        await prisma.upload.update({
          where: { id: existing.id },
          data: {
            rawData:  merged as unknown as Prisma.InputJsonValue,
            fileName: `${existing.fileName} + ${file.name}`,
          },
        });
        uploadId = existing.id;
      } else {
        const created = await prisma.upload.create({
          data: {
            branch,
            fileType:    "EXCEL",
            fileName:    file.name,
            rawData:     parsedData as unknown as Prisma.InputJsonValue,
            htmlContent: null,
            uploadedBy:  user.id,
            dateKey,
            monthKey,
          },
        });
        uploadId = created.id;
      }
    } else {
      // All other branches: standard single-file create
      const created = await prisma.upload.create({
        data: {
          branch,
          fileType:    isExcel ? "EXCEL" : "HTML",
          fileName:    file.name,
          rawData:     parsedData as unknown as Prisma.InputJsonValue,
          htmlContent: htmlContent,
          uploadedBy:  user.id,
          dateKey,
          monthKey,
        },
      });
      uploadId = created.id;
    }

    // Fire-and-forget
    Promise.all([
      createAuditLog({
        userId:    user.id,
        action:    "UPLOAD_CREATED",
        resource:  "Upload",
        resourceId: uploadId,
        metadata:  { branch, fileName: file.name, dateKey },
        ipAddress: ip,
      }),
      buildDailySnapshot(dateKey).catch(console.error),
      publishEvent({ type: "upload-complete", branch, dateKey, uploadedBy: user.name }),
      publishEvent({ type: "dashboard-updated", dateKey }),
    ]).catch(console.error);

    return successResponse({ success: true, message: "File uploaded successfully" });
  } catch (error: any) {
    console.error("Upload error:", error);
    if (
      error?.message?.includes("Unrecognized Excel format") ||
      error?.message?.includes("header row") ||
      error?.message?.includes("Could not find")
    ) {
      return errorResponse(error.message, 422);
    }
    return errorResponse("Internal server error", 500);
  }
}
