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

    let parsedData: any;

    if (isExcel) {
      parsedData = await parseExcelBuffer(arrayBuffer, branch as BranchName);
    } else {
      const htmlContent = buffer.toString("utf-8");
      parsedData = parseHtmlContent(htmlContent);
      if (parsedData.branch.toLowerCase() !== branch.toLowerCase()) {
        parsedData.branch = branch as BranchName;
      }
    }

    // Determine a human-friendly label for the report type so the UI can show it.
    let reportTypeLabel: string | undefined;
    if (parsedData.fileType === "TRANSACTION") {
      reportTypeLabel = "Transaction Statement (Interest Extract)";
    } else if (parsedData.fileType === "LOAN_BALANCE") {
      reportTypeLabel = "Loan Balance Statement";
    }

    return successResponse({
      // Core fields always present
      closingBalance:  parsedData.closingBalance  ?? 0,
      disbursement:    parsedData.disbursement    ?? 0,
      collection:      parsedData.collection      ?? 0,
      npa:             parsedData.npa             ?? 0,
      totalAccounts:   parsedData.totalAccounts   ?? null,
      totalCustomers:  parsedData.totalCustomers  ?? null,
      dpdBuckets:      parsedData.dpdBuckets      ?? null,
      reportDateRange: parsedData.reportDateRange ?? null,
      // Gold Loan extended fields
      goldPledgedGrams:    parsedData.goldPledgedGrams    ?? null,
      avgYield:            parsedData.avgYield            ?? null,
      principalCollection: parsedData.principalCollection ?? null,
      interestCollection:  parsedData.interestCollection  ?? null,
      ftdDisbursement:     parsedData.ftdDisbursement     ?? null,
      mtdDisbursement:     parsedData.mtdDisbursement     ?? null,
      ytdDisbursement:     parsedData.ytdDisbursement     ?? null,
      gnpaAmount:          parsedData.gnpaAmount          ?? null,
      gnpaPct:             parsedData.gnpaPct             ?? null,
      overdueAmount:       parsedData.overdueAmount       ?? null,
      overduePct:          parsedData.overduePct          ?? null,
      // Meta
      fileType:        isExcel ? "EXCEL" : "HTML",
      reportType:      parsedData.fileType,
      reportTypeLabel,
      fileName:        file.name,
      branch,
    });
  } catch (error: any) {
    console.error("Preview error:", error);
    if (
      error?.message?.includes("Unrecognized Excel format") ||
      error?.message?.includes("header row") ||
      error?.message?.includes("Could not find")
    ) {
      return errorResponse(error.message, 422);
    }
    return errorResponse(
      error?.message || "Failed to parse file. Please check the format.",
      422
    );
  }
}
