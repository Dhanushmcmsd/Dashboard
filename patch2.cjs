const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, 'app', 'api');

// 1.5 & 3.2 app/api/upload/route.ts
let uploadTs = fs.readFileSync(path.join(apiDir, 'upload', 'route.ts'), 'utf8');
if (!uploadTs.includes('requireAuth')) {
  uploadTs = `import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { HTTP_STATUS, UPLOAD_LIMITS, PUSHER_CHANNELS, PUSHER_EVENTS, BRANCHES } from "@/lib/constants";
import { parseExcelBuffer } from "@/lib/excel-parser";
import { parseHtmlContent } from "@/lib/html-parser";
import { buildDailySnapshot } from "@/lib/snapshot-generator";
import { getTodayKey, getMonthKey } from "@/lib/utils";
import { pusherServer } from "@/lib/pusher-server";
import type { BranchName, SessionUser } from "@/types";
import { rateLimit } from "@/lib/rate-limit";

const uploadLimiter = rateLimit({ interval: 60_000, uniqueTokenPerInterval: 500 });

export async function POST(req: NextRequest) {
  try {
    await uploadLimiter.check(req, 10, "UPLOAD");
  } catch {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const { error, user } = await requireAuth("EMPLOYEE");
    if (error) return error;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const branch = formData.get("branch") as string | null;
    if (!file || !branch) return errorResponse("file and branch are required", HTTP_STATUS.BAD_REQUEST);
    if (!BRANCHES.includes(branch as BranchName)) return errorResponse("Invalid branch", HTTP_STATUS.BAD_REQUEST);
    if (!user.branches.includes(branch)) return errorResponse("Not assigned to this branch", HTTP_STATUS.FORBIDDEN);
    
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Maximum size is 5MB." }, { status: 413 });
    }

    const ALLOWED_MIME_TYPES = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
      "application/csv",
      "text/html",
      "application/xhtml+xml",
    ];
    if (!ALLOWED_MIME_TYPES.includes(file.type) && file.type !== "") {
      return NextResponse.json({ error: "Invalid file type. Only Excel, CSV, or HTML files are allowed." }, { status: 400 });
    }

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
      // Note: HTML files >1MB should be moved to S3/R2. Limiting to 1MB here.
      if (htmlContent.length > 1 * 1024 * 1024) {
        return NextResponse.json({ error: "HTML file too large. Maximum 1MB for dashboard files." }, { status: 413 });
      }
      rawData = { ...parseHtmlContent(htmlContent), branch };
    }

    const existing = await prisma.upload.findFirst({
      where: { uploadedBy: user.id, branch, dateKey },
    });

    let uploadRecord;
    if (existing) {
      uploadRecord = await prisma.upload.update({
        where: { id: existing.id },
        data: { fileType: isExcel ? "EXCEL" : "HTML", fileName: file.name, rawData, htmlContent },
      });
    } else {
      uploadRecord = await prisma.upload.create({
        data: { branch, fileType: isExcel ? "EXCEL" : "HTML", fileName: file.name, rawData, htmlContent, uploadedBy: user.id, dateKey, monthKey }
      });
    }

    try {
      await buildDailySnapshot(dateKey);
      await pusherServer.trigger(PUSHER_CHANNELS.UPLOADS, PUSHER_EVENTS.UPLOAD_COMPLETE, { branch, dateKey });
      await pusherServer.trigger(PUSHER_CHANNELS.DASHBOARD, PUSHER_EVENTS.DASHBOARD_UPDATED, { dateKey });
    } catch (snapErr) {
      console.error("Snapshot generation failed:", snapErr);
    }

    return successResponse({ uploaded: true, branch, dateKey, upload: uploadRecord }, HTTP_STATUS.CREATED);
  } catch { return errorResponse("Upload failed"); }
}
`;
  fs.writeFileSync(path.join(apiDir, 'upload', 'route.ts'), uploadTs);
}

// Write lib/rate-limit.ts
const rateLimitContent = `import { LRUCache } from "lru-cache";
import { NextRequest } from "next/server";

export function rateLimit(options?: {
  interval?: number;
  uniqueTokenPerInterval?: number;
}) {
  const tokenCache = new LRUCache({
    max: options?.uniqueTokenPerInterval || 500,
    ttl: options?.interval || 60000,
  });

  return {
    check: (req: NextRequest, limit: number, token: string) =>
      new Promise<void>((resolve, reject) => {
        const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
        const tokenKey = token + ip;
        const tokenCount = (tokenCache.get(tokenKey) as number[]) || [0];
        if (tokenCount[0] === 0) {
          tokenCache.set(tokenKey, tokenCount);
        }
        tokenCount[0] += 1;

        const currentUsage = tokenCount[0];
        const isRateLimited = currentUsage > limit;
        if (isRateLimited) {
          return reject();
        }
        return resolve();
      }),
  };
}
`;
fs.writeFileSync(path.join(__dirname, 'lib', 'rate-limit.ts'), rateLimitContent);

console.log('Script 2 done');
