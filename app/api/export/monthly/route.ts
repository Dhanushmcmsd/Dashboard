import { requireAuth } from "@/lib/auth-guard";
import { errorResponse } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(["MANAGEMENT", "ADMIN", "SUPER_ADMIN"]);
    if (auth.error || !auth.user) {
      return errorResponse(auth.error || "Unauthorized", auth.status || 401);
    }

    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get("month");

    const snapshot = monthParam
      ? await prisma.monthlySnapshot.findUnique({ where: { monthKey: monthParam } })
      : await prisma.monthlySnapshot.findFirst({ orderBy: { monthKey: "desc" } });

    if (!snapshot) {
      return errorResponse("No snapshot found for the requested month", 404);
    }

    const data = snapshot.combinedData as any;
    const branches: any[] = data.branches ?? [];
    const totals = data.totals ?? {};
    const monthKey: string = snapshot.monthKey;

    const wb = new ExcelJS.Workbook();
    wb.creator = "BranchSync";
    wb.created = new Date();

    // ── Sheet 1: Monthly Summary ─────────────────────────────────────────────
    const ws1 = wb.addWorksheet("Summary");
    ws1.columns = [
      { header: "Branch",          key: "branch",         width: 20 },
      { header: "Closing Balance", key: "closingBalance",  width: 20 },
      { header: "Disbursement",    key: "disbursement",    width: 20 },
      { header: "Collection",      key: "collection",      width: 20 },
      { header: "NPA",             key: "npa",             width: 18 },
      { header: "Growth %",        key: "growthPercent",   width: 14 },
      { header: "Last Upload",     key: "uploadedAt",      width: 22 },
    ];

    const headerRow1 = ws1.getRow(1);
    headerRow1.eachCell((cell) => {
      cell.fill   = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
      cell.font   = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });
    headerRow1.height = 22;

    const moneyFmt  = "#,##0";
    const moneyCols = ["B", "C", "D", "E"];

    branches.forEach((b) => {
      const row = ws1.addRow({
        branch:         b.branch,
        closingBalance: b.closingBalance,
        disbursement:   b.disbursement,
        collection:     b.collection,
        npa:            b.npa,
        growthPercent:  b.growthPercent !== null && b.growthPercent !== undefined
          ? `${b.growthPercent > 0 ? "+" : ""}${b.growthPercent}%`
          : "N/A",
        uploadedAt: b.uploadedAt ? new Date(b.uploadedAt).toLocaleString("en-IN") : "",
      });
      moneyCols.forEach((col) => {
        row.getCell(col).numFmt = moneyFmt;
      });
      // Colour growth cell
      const gCell = row.getCell("F");
      if (typeof b.growthPercent === "number") {
        gCell.font = {
          bold:  true,
          color: { argb: b.growthPercent >= 0 ? "FF16A34A" : "FFDC2626" },
        };
      }
    });

    // Totals row
    const totalsRow = ws1.addRow({
      branch:        "TOTAL",
      closingBalance: totals.closingBalance ?? 0,
      disbursement:   totals.disbursement   ?? 0,
      collection:     totals.collection     ?? 0,
      npa:            totals.npa            ?? 0,
      growthPercent:  "",
      uploadedAt:     "",
    });
    totalsRow.font = { bold: true };
    totalsRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8F0FE" } };
    moneyCols.forEach((col) => {
      totalsRow.getCell(col).numFmt = moneyFmt;
    });

    const buffer = await wb.xlsx.writeBuffer();

    return new Response(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="monthly-report-${monthKey}.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Export monthly error:", error);
    return errorResponse("Failed to generate export", 500);
  }
}
