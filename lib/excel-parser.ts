import ExcelJS from "exceljs";
import { ParsedRow, BranchName, DpdBucket, BRANCHES } from "@/types";

export async function parseExcelBuffer(buffer: ArrayBuffer): Promise<ParsedRow[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const rows: Record<string, any>[] = [];
  let headers: string[] = [];

  sheet.eachRow((row, rowIndex) => {
    if (rowIndex === 1) {
      headers = (row.values as any[]).slice(1).map((h) =>
        String(h ?? "").toLowerCase().trim()
      );
    } else {
      const values = (row.values as any[]).slice(1);
      const obj: Record<string, any> = {};
      headers.forEach((h, i) => { obj[h] = values[i]; });
      rows.push(obj);
    }
  });

  const parsedRows: ParsedRow[] = [];

  for (const normalizedRow of rows) {
    const branchRaw = normalizedRow["branch"];
    if (!branchRaw) continue;

    const branchName = BRANCHES.find(
      (b) => b.toLowerCase() === String(branchRaw).toLowerCase()
    );
    if (!branchName) continue;

    const getNumber = (keys: string[]) => {
      for (const k of keys) {
        const val = Number(normalizedRow[k]);
        if (!isNaN(val)) return val;
      }
      return 0;
    };

    const closingBalance = getNumber(["closing balance", "closing_balance", "closing"]);
    const disbursement = getNumber(["disbursement", "disburse"]);
    const collection = getNumber(["collection", "collected"]);
    const npa = getNumber(["npa"]);

    const dpdBuckets: Record<DpdBucket, { count: number; amount: number }> = {
      "0": { count: getNumber(["0 dpd count", "0_dpd_count"]), amount: getNumber(["0 dpd amount", "0_dpd_amount"]) },
      "1-30": { count: getNumber(["1-30 dpd count", "1_30_dpd_count"]), amount: getNumber(["1-30 dpd amount", "1_30_dpd_amount"]) },
      "31-60": { count: getNumber(["31-60 dpd count", "31_60_dpd_count"]), amount: getNumber(["31-60 dpd amount", "31_60_dpd_amount"]) },
      "61-90": { count: getNumber(["61-90 dpd count", "61_90_dpd_count"]), amount: getNumber(["61-90 dpd amount", "61_90_dpd_amount"]) },
      "91-180": { count: getNumber(["91-180 dpd count", "91_180_dpd_count"]), amount: getNumber(["91-180 dpd amount", "91_180_dpd_amount"]) },
      "181+": { count: getNumber(["181+ dpd count", "181_plus_dpd_count"]), amount: getNumber(["181+ dpd amount", "181_plus_dpd_amount"]) },
    };

    parsedRows.push({
      branch: branchName,
      closingBalance,
      disbursement,
      collection,
      npa,
      dpdBuckets,
    });
  }

  return parsedRows;
}
