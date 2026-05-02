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
    const dateParam = searchParams.get("date");

    const snapshot = dateParam
      ? await prisma.dailySnapshot.findUnique({ where: { dateKey: dateParam } })
      : await prisma.dailySnapshot.findFirst({ orderBy: { dateKey: "desc" } });

    if (!snapshot) {
      return errorResponse("No snapshot found for the requested date", 404);
    }

    const data = snapshot.combinedData as any;
    const branches: any[] = data.branches ?? [];
    const totals = data.totals ?? {};
    const dateKey: string = snapshot.dateKey;

    const wb = new ExcelJS.Workbook();
    wb.creator = "BranchSync";
    wb.created = new Date();

    // ── Sheet 1: Summary ────────────────────────────────────────────────────
    const ws1 = wb.addWorksheet("Summary");

    ws1.columns = [
      { header: "Branch",          key: "branch",         width: 20 },
      { header: "Closing Balance", key: "closingBalance",  width: 20 },
      { header: "Disbursement",    key: "disbursement",    width: 20 },
      { header: "Collection",      key: "collection",      width: 20 },
      { header: "NPA",             key: "npa",             width: 18 },
      { header: "Uploaded At",     key: "uploadedAt",      width: 22 },
    ];

    // Style header row
    const headerRow1 = ws1.getRow(1);
    headerRow1.eachCell((cell) => {
      cell.fill   = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
      cell.font   = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        bottom: { style: "thin", color: { argb: "FFFFFFFF" } },
      };
    });
    headerRow1.height = 22;

    const moneyFmt = "#,##0";
    const moneyCols = ["B", "C", "D", "E"];

    branches.forEach((b) => {
      const row = ws1.addRow({
        branch:         b.branch,
        closingBalance: b.closingBalance,
        disbursement:   b.disbursement,
        collection:     b.collection,
        npa:            b.npa,
        uploadedAt:     b.uploadedAt ? new Date(b.uploadedAt).toLocaleString("en-IN") : "",
      });
      moneyCols.forEach((col) => {
        row.getCell(col).numFmt = moneyFmt;
      });
    });

    // Totals row
    const totalsRow = ws1.addRow({
      branch:         "TOTAL",
      closingBalance: totals.closingBalance ?? 0,
      disbursement:   totals.disbursement ?? 0,
      collection:     totals.collection ?? 0,
      npa:            totals.npa ?? 0,
      uploadedAt:     "",
    });
    totalsRow.font = { bold: true };
    totalsRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8F0FE" } };
    moneyCols.forEach((col) => {
      totalsRow.getCell(col).numFmt = moneyFmt;
    });

    // ── Sheet 2: DPD Buckets ─────────────────────────────────────────────────
    const ws2 = wb.addWorksheet("DPD Buckets");
    ws2.columns = [
      { header: "Branch",     key: "branch",  width: 20 },
      { header: "DPD Bucket", key: "bucket",  width: 14 },
      { header: "Count",      key: "count",   width: 12 },
      { header: "Amount",     key: "amount",  width: 20 },
    ];

    const headerRow2 = ws2.getRow(1);
    headerRow2.eachCell((cell) => {
      cell.fill   = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
      cell.font   = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });
    headerRow2.height = 22;

    branches.forEach((b) => {
      const buckets = b.dpdBuckets ?? {};
      Object.entries(buckets).forEach(([bucket, val]: [string, any]) => {
        const row = ws2.addRow({
          branch: b.branch,
          bucket,
          count:  val?.count ?? 0,
          amount: val?.amount ?? 0,
        });
        row.getCell("D").numFmt = moneyFmt;
      });
    });

    const buffer = await wb.xlsx.writeBuffer();

    return new Response(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="daily-report-${dateKey}.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Export daily error:", error);
    return errorResponse("Failed to generate export", 500);
  }
}
