import { requireAuth } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { parseExcelBuffer } from "@/lib/excel-parser";
import { parseHtmlContent } from "@/lib/html-parser";
import { BranchName } from "@/types";

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(["EMPLOYEE"]);
    if (auth.error || !auth.user) {
      return errorResponse(auth.error || "Unauthorized", auth.status || 401);
    }

    const user = auth.user!;
    const formData = await req.formData();
    const file = formData.get("file") as File;
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
    const isExcel = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");
    const isHtml = fileName.endsWith(".html") || fileName.endsWith(".htm");

    if (!isExcel && !isHtml) {
      return errorResponse("Only Excel and HTML files are allowed", 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let parsedData: any = null;

    if (isExcel) {
      parsedData = await parseExcelBuffer(arrayBuffer, branch as BranchName);
    } else {
      const htmlContent = buffer.toString("utf-8");
      parsedData = parseHtmlContent(htmlContent);
      if (parsedData.branch.toLowerCase() !== branch.toLowerCase()) {
        parsedData.branch = branch as BranchName;
      }
    }

    return successResponse({
      closingBalance: parsedData.closingBalance ?? 0,
      disbursement: parsedData.disbursement ?? 0,
      collection: parsedData.collection ?? 0,
      npa: parsedData.npa ?? 0,
      totalAccounts: parsedData.totalAccounts ?? null,
      dpdBuckets: parsedData.dpdBuckets ?? null,
      reportDateRange: parsedData.reportDateRange ?? null,
      fileType: isExcel ? "EXCEL" : "HTML",
      fileName: file.name,
      branch,
    });
  } catch (error: any) {
    console.error("Preview error:", error);
    if (
      error?.message?.includes("Unrecognized Excel format") ||
      error?.message?.includes("header row")
    ) {
      return errorResponse(error.message, 422);
    }
    return errorResponse(
      error?.message || "Failed to parse file. Please check the format.",
      422
    );
  }
}
