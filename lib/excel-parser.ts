import ExcelJS from "exceljs";
import { ParsedRow, BranchName, DPD_BUCKETS, DpdBucket } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────

function toNum(v: unknown): number {
  if (v === null || v === undefined || v === "") return 0;
  // ExcelJS rich-text objects
  if (typeof v === "object" && v !== null && "result" in v) return toNum((v as any).result);
  if (typeof v === "object" && v !== null && "text" in v)   return toNum((v as any).text);
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

function parseDateVal(v: unknown): Date | null {
  if (!v) return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  // ExcelJS may return {result, date1904} objects for formula cells
  if (typeof v === "object" && v !== null && "result" in v) return parseDateVal((v as any).result);
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? null : d;
}

/** Normalise a header string to lowercase, collapse whitespace/newlines. */
function normHeader(h: unknown): string {
  return String(h ?? "")
    .toLowerCase()
    .replace(/[\n\r]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ── Column alias map ─────────────────────────────────────────────────────────
// Maps canonical key → list of possible header strings (all lower-case)
const ALIASES: Record<string, string[]> = {
  "account number":   ["account number", "account num#", "loan account number", "account no", "acc no"],
  "customer number":  ["customer number", "customer id", "customer no"],
  "closing balance":  ["closing balance", "closing bal", "principal outstanding", "outstanding balance"],
  "principal credit": ["principal credit", "principal cr.", "principal cr"],
  "interest amount":  ["tot. intr. amount", "total interest amount", "tot intr amount", "interest rcvd during", "interest rcvd"],
  "issue amount":     ["issue amount", "disbursed amount", "principal amount"],
  "issue date":       ["issue date", "disbursement date", "disbursment date"],  // typo in some exports
  "ornament weight":  ["ornament weight", "gold wt.", "gold weight", "gold wt"],
  "dpd":              ["dpd", "days past due", "days overdue"],
  "rate":             ["rate of interest", "total interest rate", "interest rate"],
};

/** Build a reverse map: header string → canonical key */
function buildAliasLookup(headers: string[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const [canonical, aliases] of Object.entries(ALIASES)) {
    for (const alias of aliases) {
      map.set(alias, canonical);
    }
  }
  // Also map each header directly to itself (canonical passthrough)
  for (const h of headers) map.set(h, h);
  return map;
}

/** Normalise a data row's keys using the alias lookup. */
function normaliseRow(
  raw: Record<string, unknown>,
  lookup: Map<string, string>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) {
    const canon = lookup.get(k) ?? k;
    // Prefer the first value set (handles duplicate aliases resolving to same canonical)
    if (!(canon in out)) out[canon] = v;
  }
  return out;
}

// ── DPD helpers ──────────────────────────────────────────────────────────────

function dpdBucket(dpd: number): DpdBucket {
  if (dpd <= 0)   return "0";
  if (dpd <= 30)  return "1-30";
  if (dpd <= 60)  return "31-60";
  if (dpd <= 90)  return "61-90";
  if (dpd <= 180) return "91-180";
  return "181+";
}

function emptyBuckets(): Record<DpdBucket, { count: number; amount: number }> {
  return Object.fromEntries(
    DPD_BUCKETS.map((b) => [b, { count: 0, amount: 0 }])
  ) as Record<DpdBucket, { count: number; amount: number }>;
}

// ── Date range helpers ───────────────────────────────────────────────────────

function extractDateRange(titleCell: string): {
  from: Date | null;
  to: Date | null;
  label: string;
} {
  // "between DD-MM-YYYY and DD-MM-YYYY"
  const m = titleCell.match(/between\s+([\d]{2}-[\d]{2}-[\d]{4})\s+and\s+([\d]{2}-[\d]{2}-[\d]{4})/i);
  if (!m) return { from: null, to: null, label: "" };
  const parse = (s: string) => {
    const [d, mo, y] = s.split("-");
    return new Date(`${y}-${mo}-${d}`);
  };
  const from = parse(m[1]);
  const to   = parse(m[2]);
  if (isNaN(from.getTime()) || isNaN(to.getTime()))
    return { from: null, to: null, label: "" };
  return { from, to, label: `${m[1]} to ${m[2]}` };
}

/** Indian financial year starts in April. Returns April 1 of the current FY. */
function fyStart(refDate: Date): Date {
  // April is month index 3
  return refDate.getMonth() >= 3
    ? new Date(refDate.getFullYear(), 3, 1)
    : new Date(refDate.getFullYear() - 1, 3, 1);
}

/** Compare two dates ignoring time component. */
function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()
  );
}

// ── File-type detection ──────────────────────────────────────────────────────

function detectFileType(headers: string[]): "LOAN_BALANCE" | "TRANSACTION" | "UNKNOWN" {
  const h = headers; // already normalised
  const has = (col: string) => h.some((x) => x.includes(col));
  if (has("closing balance") || has("principal outstanding")) return "LOAN_BALANCE";
  if (has("tot. intr. amount") || has("principal credit"))    return "TRANSACTION";
  return "UNKNOWN";
}

// ─────────────────────────────────────────────────────────────────────────────
// Main entry point
// ─────────────────────────────────────────────────────────────────────────────

export async function parseExcelBuffer(
  buffer: ArrayBuffer,
  branch: BranchName
): Promise<ParsedRow> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error("Excel file has no sheets");

  // ── Row 1: title / date range ──
  const titleText = String(sheet.getRow(1).getCell(1).value ?? "");
  const dateRange  = extractDateRange(titleText);

  // ── Find header row ──
  // Usually row 2 for this report family, but scan the first 10 rows to be safe.
  let headerRowIndex = -1;
  let rawHeaders: string[] = [];

  const HEADER_SIGNALS = [
    "issue date", "branch name", "account number", "account num#",
    "closing balance", "loan type", "principal credit",
  ];

  sheet.eachRow((row, idx) => {
    if (headerRowIndex !== -1 || idx > 10) return;
    const vals = (row.values as unknown[]).slice(1);
    const normed = vals.map(normHeader);
    if (HEADER_SIGNALS.some((sig) => normed.some((h) => h.includes(sig)))) {
      headerRowIndex = idx;
      rawHeaders = normed;
    }
  });

  if (headerRowIndex === -1 || rawHeaders.length === 0)
    throw new Error(
      "Could not find header row in Excel file. " +
      "Expected columns like 'Issue Date', 'Account Number', or 'Closing Balance'."
    );

  const fileType = detectFileType(rawHeaders);
  if (fileType === "UNKNOWN")
    throw new Error(
      `Unrecognized Excel format. ` +
      `Expected a Loan Balance Statement or Transaction Statement. ` +
      `Headers found: ${rawHeaders.slice(0, 8).join(", ")}`
    );

  // ── Build alias lookup from actual headers ──
  const aliasLookup = buildAliasLookup(rawHeaders);

  // ── Read data rows ──
  const rows: Record<string, unknown>[] = [];
  sheet.eachRow((row, idx) => {
    if (idx <= headerRowIndex) return;
    const vals = (row.values as unknown[]).slice(1);
    // Skip entirely blank rows
    if (!vals[0] && !vals[1] && !vals[2]) return;
    const raw: Record<string, unknown> = {};
    rawHeaders.forEach((h, i) => { if (h) raw[h] = vals[i]; });
    rows.push(normaliseRow(raw, aliasLookup));
  });

  if (rows.length === 0)
    throw new Error("No data rows found in Excel file");

  if (fileType === "LOAN_BALANCE")
    return parseLoanBalanceStatement(rows, branch, dateRange);

  return parseTransactionStatement(rows, branch, dateRange);
}

// ─────────────────────────────────────────────────────────────────────────────
// Transaction Statement Parser (Loan Interest Extract)
// ─────────────────────────────────────────────────────────────────────────────

function parseTransactionStatement(
  rows: Record<string, unknown>[],
  branch: BranchName,
  dateRange: { from: Date | null; to: Date | null; label: string }
): ParsedRow {
  const reportTo   = dateRange.to   ?? new Date();
  const monthStart = new Date(reportTo.getFullYear(), reportTo.getMonth(), 1);
  const aprilOfFY  = fyStart(reportTo);

  // Per-transaction accumulators (every row = one transaction)
  let principalColl = 0;
  let interestColl  = 0;

  // Per-account deduplication (weight / rate / issue amount / issue date are stable per account)
  const accountMap = new Map<string, {
    weight: number;
    rate: number;
    issueAmount: number;
    issueDate: Date | null;
  }>();
  const customerSet = new Set<string>();

  for (const row of rows) {
    const acctNo  = String(row["account number"]  ?? "").trim();
    const custNo  = String(row["customer number"] ?? "").trim();
    const principalCr = toNum(row["principal credit"]);
    const totIntr     = toNum(row["interest amount"]); // canonical alias for tot. intr. amount
    const weight      = toNum(row["ornament weight"]);
    const rate        = toNum(row["rate"]);
    const issueAmt    = toNum(row["issue amount"]);
    const issueDate   = parseDateVal(row["issue date"]);

    // Sum collections from EVERY transaction row
    principalColl += principalCr;
    interestColl  += totIntr;

    if (custNo) customerSet.add(custNo);

    // Record per-account data only on first occurrence
    if (acctNo && !accountMap.has(acctNo)) {
      accountMap.set(acctNo, { weight, rate, issueAmount: issueAmt, issueDate });
    }
  }

  const accounts = [...accountMap.values()];
  const totalAccounts  = accountMap.size;
  const totalCustomers = customerSet.size;

  // ── FTD / MTD / YTD disbursements (deduplicated by account) ──
  let ftdDisb = 0, mtdDisb = 0, ytdDisb = 0;
  for (const { issueAmount, issueDate } of accounts) {
    if (!issueDate || issueAmount <= 0) continue;
    if (issueDate >= aprilOfFY  && issueDate <= reportTo) ytdDisb += issueAmount;
    if (issueDate >= monthStart && issueDate <= reportTo) mtdDisb += issueAmount;
    if (sameDay(issueDate, reportTo))                     ftdDisb += issueAmount;
  }

  // ── Gold weight and average yield (deduplicated by account) ──
  const goldPledgedGrams = accounts.reduce((s, a) => s + a.weight, 0);
  const avgYield = totalAccounts > 0
    ? accounts.reduce((s, a) => s + a.rate, 0) / totalAccounts
    : 0;

  return {
    branch,
    // AUM not available from this report type — requires Loan Balance Statement
    closingBalance: 0,
    disbursement:   mtdDisb,
    collection:     principalColl + interestColl,
    npa:            0,
    dpdBuckets:     emptyBuckets(),
    totalAccounts,
    totalCustomers,
    goldPledgedGrams,
    avgYield,
    principalCollection: principalColl,
    interestCollection:  interestColl,
    ftdDisbursement: ftdDisb,
    mtdDisbursement: mtdDisb,
    ytdDisbursement: ytdDisb,
    reportDateRange: dateRange.label || undefined,
    fileType: "TRANSACTION",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Loan Balance Statement Parser
// ─────────────────────────────────────────────────────────────────────────────

function parseLoanBalanceStatement(
  rows: Record<string, unknown>[],
  branch: BranchName,
  dateRange: { from: Date | null; to: Date | null; label: string }
): ParsedRow {
  const reportEndDate = dateRange.to ?? new Date();
  const monthStart    = new Date(reportEndDate.getFullYear(), reportEndDate.getMonth(), 1);
  const aprilOfFY     = fyStart(reportEndDate);

  let totalAUM       = 0;
  let totalGoldWt    = 0;
  let rateSum        = 0;
  let rateCount      = 0;
  let principalColl  = 0;
  let interestColl   = 0;
  let overdueAUM     = 0;
  let gnpaAUM        = 0;
  let ftdDisb        = 0;
  let mtdDisb        = 0;
  let ytdDisb        = 0;
  const buckets      = emptyBuckets();
  const accountSet   = new Set<string>();
  const customerSet  = new Set<string>();

  for (const row of rows) {
    const closing     = toNum(row["closing balance"]);
    const disbAmt     = toNum(row["issue amount"]);
    const principalCr = toNum(row["principal credit"]);
    const interestRcvd = toNum(row["interest amount"]);
    const goldWt      = toNum(row["ornament weight"]);
    const rate        = toNum(row["rate"]);
    const dpd         = toNum(row["dpd"]);
    const disbDate    = parseDateVal(row["issue date"]);
    const acct        = String(row["account number"] ?? "").trim();
    const cust        = String(row["customer number"] ?? "").trim();

    if (acct) accountSet.add(acct);
    if (cust) customerSet.add(cust);

    totalAUM      += closing;
    totalGoldWt   += goldWt;
    principalColl += principalCr;
    interestColl  += interestRcvd;

    if (rate > 0) { rateSum += rate; rateCount++; }

    const bucket = dpdBucket(dpd);
    buckets[bucket].count++;
    buckets[bucket].amount += closing;

    if (dpd > 0)  overdueAUM += closing;
    if (dpd > 90) gnpaAUM    += closing;

    if (disbDate) {
      if (disbDate >= aprilOfFY  && disbDate <= reportEndDate) ytdDisb += disbAmt;
      if (disbDate >= monthStart && disbDate <= reportEndDate) mtdDisb += disbAmt;
      if (sameDay(disbDate, reportEndDate))                    ftdDisb += disbAmt;
    }
  }

  const totalAccounts  = accountSet.size  || rows.length;
  const totalCustomers = customerSet.size;
  const avgYield       = rateCount > 0 ? rateSum / rateCount : 0;
  const gnpaPct        = totalAUM > 0 ? (gnpaAUM   / totalAUM) * 100 : 0;
  const overduePct     = totalAUM > 0 ? (overdueAUM / totalAUM) * 100 : 0;
  const avgTicketSize  = totalAccounts > 0 ? totalAUM    / totalAccounts : 0;
  const avgGoldPerLoan = totalAccounts > 0 ? totalGoldWt / totalAccounts : 0;

  return {
    branch,
    closingBalance: totalAUM,
    disbursement:   mtdDisb,
    collection:     principalColl + interestColl,
    npa:            gnpaAUM,
    dpdBuckets:     buckets,
    totalAccounts,
    totalCustomers,
    avgYield,
    goldPledgedGrams:   totalGoldWt,
    gnpaAmount:         gnpaAUM,
    gnpaPct,
    overdueAmount:      overdueAUM,
    overduePct,
    avgTicketSize,
    avgGoldPerLoan,
    principalCollection: principalColl,
    interestCollection:  interestColl,
    ftdDisbursement:     ftdDisb,
    mtdDisbursement:     mtdDisb,
    ytdDisbursement:     ytdDisb,
    reportDateRange:     dateRange.label || undefined,
    fileType:            "LOAN_BALANCE",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Merge helper: combine TRANSACTION + LOAN_BALANCE for the same branch/day
// ─────────────────────────────────────────────────────────────────────────────

export function mergeReports(existing: ParsedRow, incoming: ParsedRow): ParsedRow {
  const isBalance     = (r: ParsedRow) => r.fileType === "LOAN_BALANCE";
  const balanceReport = isBalance(incoming) ? incoming : (isBalance(existing) ? existing : null);
  const txnReport     = !isBalance(incoming) ? incoming : (!isBalance(existing) ? existing : null);

  if (!balanceReport || !txnReport) {
    // Same type uploaded twice — just use the newer one (incoming)
    return incoming;
  }

  const collEff = calculateCollectionEfficiency(balanceReport, txnReport);

  return {
    ...balanceReport,             // Full AUM / DPD data from balance report
    // Prefer transaction report's collection figures if non-zero
    collection:          txnReport.collection          || balanceReport.collection,
    principalCollection: txnReport.principalCollection ?? balanceReport.principalCollection,
    interestCollection:  txnReport.interestCollection  ?? balanceReport.interestCollection,
    // Prefer balance report's disbursement (more accurate)
    disbursement:        balanceReport.disbursement     || txnReport.disbursement,
    ftdDisbursement:     balanceReport.ftdDisbursement  ?? txnReport.ftdDisbursement,
    mtdDisbursement:     balanceReport.mtdDisbursement  ?? txnReport.mtdDisbursement,
    ytdDisbursement:     balanceReport.ytdDisbursement  ?? txnReport.ytdDisbursement,
    // Gold weight: prefer balance (per loan at close), fallback to transaction
    goldPledgedGrams:    balanceReport.goldPledgedGrams ?? txnReport.goldPledgedGrams,
    collectionEfficiency: collEff,
    fileType: "LOAN_BALANCE",  // merged record has full balance data
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Collection Efficiency (needs both report types)
// ─────────────────────────────────────────────────────────────────────────────

function calculateCollectionEfficiency(
  balanceReport: ParsedRow,
  txnReport: ParsedRow
): number {
  // We can only calculate this if we have raw DPD / overdue data
  const overdueBalance = balanceReport.overdueAmount ?? 0;
  if (overdueBalance <= 0) return 0;

  // Collection from transaction report (total principal + interest)
  const collected = txnReport.collection ?? 0;

  // Efficiency = what was collected / total overdue balance
  return (collected / overdueBalance) * 100;
}
