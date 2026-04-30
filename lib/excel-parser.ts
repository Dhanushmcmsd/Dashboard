import ExcelJS from "exceljs";
import { ParsedRow, BranchName, DPD_BUCKETS, DpdBucket } from "@/types";

// ── helpers ──────────────────────────────────────────────────────────────────

function toNum(v: unknown): number {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

function toDate(v: unknown): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? null : d;
}

function normHeader(h: unknown): string {
  return String(h ?? "")
    .toLowerCase()
    .replace(/[\n\r]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Extract the date range from the report title row (row 1)
function extractDateRange(titleCell: string): { from: Date | null; to: Date | null; label: string } {
  const m = titleCell.match(/between\s+([\d-]+)\s+and\s+([\d-]+)/i);
  if (!m) return { from: null, to: null, label: "" };
  const parse = (s: string) => {
    const [d, mo, y] = s.split("-");
    return new Date(`${y}-${mo}-${d}`);
  };
  return { from: parse(m[1]), to: parse(m[2]), label: `${m[1]} to ${m[2]}` };
}

// Detect file type from headers present
function detectFileType(headers: string[]): "LOAN_BALANCE" | "TRANSACTION" | "SUMMARY" {
  const has = (col: string) => headers.some((h) => h.includes(col));
  if (has("closing balance") && has("dpd")) return "LOAN_BALANCE";
  if (has("amount received") && has("tran")) return "TRANSACTION";
  return "SUMMARY";
}

// DPD bucket label
function dpdBucket(dpd: number): DpdBucket {
  if (dpd <= 0) return "0";
  if (dpd <= 30) return "1-30";
  if (dpd <= 60) return "31-60";
  if (dpd <= 90) return "61-90";
  if (dpd <= 180) return "91-180";
  return "181+";
}

function emptyBuckets(): Record<DpdBucket, { count: number; amount: number }> {
  return Object.fromEntries(DPD_BUCKETS.map((b) => [b, { count: 0, amount: 0 }])) as Record<DpdBucket, { count: number; amount: number }>;
}

// ── main parser ───────────────────────────────────────────────────────────────

export async function parseExcelBuffer(
  buffer: ArrayBuffer,
  branch: BranchName
): Promise<ParsedRow> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error("Excel file has no sheets");

  // Row 1 is usually a title like "Supra Pacific... Balance Statement Between ..."
  const titleRow = sheet.getRow(1);
  const titleText = String(titleRow.getCell(1).value ?? "");
  const dateRange = extractDateRange(titleText);

  // Find the actual header row (first row where first cell looks like a column name, not a title)
  let headerRowIndex = 1;
  let headers: string[] = [];

  sheet.eachRow((row, idx) => {
    if (headers.length > 0) return;
    const vals = (row.values as unknown[]).slice(1);
    const first = normHeader(vals[0]);
    // Header rows typically start with scheme/issue/loan type identifiers
    if (
      first.includes("scheme") ||
      first.includes("issue date") ||
      first.includes("branch") ||
      first.includes("loan type")
    ) {
      headerRowIndex = idx;
      headers = vals.map(normHeader);
    }
  });

  if (headers.length === 0) throw new Error("Could not find header row in Excel file");

  const fileType = detectFileType(headers);

  // Collect data rows
  const rows: Record<string, unknown>[] = [];
  sheet.eachRow((row, idx) => {
    if (idx <= headerRowIndex) return;
    const vals = (row.values as unknown[]).slice(1);
    if (!vals[0]) return; // skip empty rows
    const obj: Record<string, unknown> = {};
    headers.forEach((h, i) => {
      if (h) obj[h] = vals[i];
    });
    rows.push(obj);
  });

  if (rows.length === 0) throw new Error("No data rows found in Excel file");

  // ── LOAN BALANCE STATEMENT ─────────────────────────────────────────────────
  if (fileType === "LOAN_BALANCE") {
    return parseLoanBalanceStatement(rows, branch, dateRange);
  }

  // ── TRANSACTION STATEMENT ─────────────────────────────────────────────────
  if (fileType === "TRANSACTION") {
    return parseTransactionStatement(rows, branch, dateRange);
  }

  throw new Error(
    `Unrecognized Excel format. Expected a Loan Balance Statement or Transaction Statement. ` +
    `Headers found: ${headers.slice(0, 6).join(", ")}`
  );
}

// ── Loan Balance Statement parser ─────────────────────────────────────────────

function parseLoanBalanceStatement(
  rows: Record<string, unknown>[],
  branch: BranchName,
  dateRange: { from: Date | null; to: Date | null; label: string }
): ParsedRow {
  const toDate = dateRange.to ?? new Date();
  const monthStart = new Date(toDate.getFullYear(), toDate.getMonth(), 1);
  const yearStart = new Date(toDate.getFullYear() - 1, 3, 1); // April 1 (financial year)

  // running accumulators
  let totalAUM = 0;
  let totalGoldWt = 0;
  let totalInterestRateSum = 0;
  let rateCount = 0;
  let principalColl = 0;
  let interestColl = 0;
  let overdueAUM = 0;
  let gnpaAUM = 0;
  let ftdDisb = 0;
  let mtdDisb = 0;
  let ytdDisb = 0;
  const buckets = emptyBuckets();
  const accountSet = new Set<string>();
  const customerSet = new Set<string>();

  for (const row of rows) {
    const get = (k: string) => toNum(row[k]);

    // Key columns — match normalised header names
    const closing = get("closing balance");
    const disbursedAmt = get("disbursed amount");
    const principalCr = get("principal cr.") || get("principal cr");
    const interestRcvd = get("interest rcvd during") || get("interest rcvd");
    const goldWt = get("gold wt.") || get("gold wt");
    const rate = get("total interest rate");
    const dpd = get("dpd");
    const disbDate = toDate(row["disbursment date"] ?? row["disbursement date"]);

    const acct = String(row["account num#"] ?? row["account number"] ?? "");
    const cust = String(row["customer id"] ?? row["customer number"] ?? "");

    if (acct) accountSet.add(acct);
    if (cust) customerSet.add(cust);

    totalAUM += closing;
    totalGoldWt += goldWt;
    principalColl += principalCr;
    interestColl += interestRcvd;

    if (rate > 0) { totalInterestRateSum += rate; rateCount++; }

    // DPD classification
    const bucket = dpdBucket(dpd);
    buckets[bucket].count++;
    buckets[bucket].amount += closing;

    if (dpd > 0) overdueAUM += closing;
    if (dpd > 90) gnpaAUM += closing;

    // Disbursement periods
    if (disbDate) {
      if (disbDate >= yearStart && disbDate <= toDate) ytdDisb += disbursedAmt;
      if (disbDate >= monthStart && disbDate <= toDate) mtdDisb += disbursedAmt;
      const todayDateOnly = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());
      const disbDateOnly = new Date(disbDate.getFullYear(), disbDate.getMonth(), disbDate.getDate());
      if (disbDateOnly.getTime() === todayDateOnly.getTime()) ftdDisb += disbursedAmt;
    }
  }

  const totalAccounts = accountSet.size || rows.length;
  const totalCustomers = customerSet.size;
  const avgYield = rateCount > 0 ? totalInterestRateSum / rateCount : 0;
  const gnpaPct = totalAUM > 0 ? (gnpaAUM / totalAUM) * 100 : 0;
  const overduePct = totalAUM > 0 ? (overdueAUM / totalAUM) * 100 : 0;
  const avgTicketSize = totalAccounts > 0 ? totalAUM / totalAccounts : 0;
  const avgGoldPerLoan = totalAccounts > 0 ? totalGoldWt / totalAccounts : 0;

  return {
    branch,
    closingBalance: totalAUM,
    disbursement: mtdDisb,
    collection: principalColl + interestColl,
    npa: gnpaAUM,
    dpdBuckets: buckets,

    totalAccounts,
    totalCustomers,
    avgYield,
    ftdDisbursement: ftdDisb,
    mtdDisbursement: mtdDisb,
    ytdDisbursement: ytdDisb,
    goldPledgedGrams: totalGoldWt,
    gnpaAmount: gnpaAUM,
    gnpaPct,
    overdueAmount: overdueAUM,
    overduePct,
    avgTicketSize,
    avgGoldPerLoan,
    principalCollection: principalColl,
    interestCollection: interestColl,
    reportDateRange: dateRange.label,
    fileType: "LOAN_BALANCE",
  };
}

// ── Transaction Statement parser ───────────────────────────────────────────────

function parseTransactionStatement(
  rows: Record<string, unknown>[],
  branch: BranchName,
  dateRange: { from: Date | null; to: Date | null; label: string }
): ParsedRow {
  let totalPrincipalColl = 0;
  let totalInterestColl = 0;
  let totalAmountRcvd = 0;
  let totalDisb = 0;
  const accountSet = new Set<string>();

  for (const row of rows) {
    const get = (k: string) => toNum(row[k]);

    const principalCr = get("principal credit");
    const interestAmt = get("tot. intr. amount") || get("tot intr amount");
    const amtRcvd = get("amount received");
    const principalDr = get("principal debit");
    const acct = String(row["account number"] ?? "");

    if (acct) accountSet.add(acct);
    totalPrincipalColl += principalCr;
    totalInterestColl += interestAmt;
    totalAmountRcvd += amtRcvd;
    if (principalDr > 0) totalDisb += principalDr; // new disbursements
  }

  return {
    branch,
    closingBalance: 0,  // Not available in transaction statement; merge with LB if needed
    disbursement: totalDisb,
    collection: totalPrincipalColl + totalInterestColl,
    npa: 0,
    dpdBuckets: emptyBuckets(),

    totalAccounts: accountSet.size,
    principalCollection: totalPrincipalColl,
    interestCollection: totalInterestColl,
    reportDateRange: dateRange.label,
    fileType: "TRANSACTION",
  };
}
