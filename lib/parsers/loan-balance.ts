import { prisma } from "@/lib/prisma";
import {
  coerceDate,
  coerceNumber,
  coerceRequiredString,
  createErrorSummary,
  extractSpreadsheetRows,
  getMappedValue,
  type ParseResult,
  type ParserColumn,
  type SpreadsheetRow,
} from "@/lib/parsers/spreadsheet";
import { LoanBucket, type GoldLoanAccount } from "@prisma/client";

type LoanBalanceField =
  | "account_number"
  | "customer_name"
  | "branch"
  | "principal_outstanding"
  | "gold_weight_grams"
  | "ltv_percent"
  | "interest_rate"
  | "disbursement_date"
  | "maturity_date"
  | "bucket";

export type ParseLoanBalanceOptions = {
  dryRun?: boolean;
  companyId?: string;
  portfolioId?: string;
  uploadId?: string;
};

export const LOAN_BALANCE_COLUMNS: ParserColumn<LoanBalanceField>[] = [
  {
    field: "account_number",
    aliases: ["Loan A/C No", "Account Number", "Loan Account", "A/C No"],
  },
  {
    field: "customer_name",
    aliases: ["Customer Name", "Borrower Name", "Name"],
  },
  {
    field: "branch",
    aliases: ["Branch", "Branch Name", "Branch Code"],
  },
  {
    field: "principal_outstanding",
    aliases: ["Principal Outstanding", "O/S Principal", "Balance"],
  },
  {
    field: "gold_weight_grams",
    aliases: ["Gold Weight", "Gold Wt (g)", "Net Weight Grams"],
  },
  {
    field: "ltv_percent",
    aliases: ["LTV %", "LTV", "Loan to Value"],
  },
  {
    field: "interest_rate",
    aliases: ["Interest Rate", "Rate %", "ROI"],
  },
  {
    field: "disbursement_date",
    aliases: ["Disbursement Date", "Loan Date", "Sanction Date"],
  },
  {
    field: "maturity_date",
    aliases: ["Maturity Date", "Due Date", "Expiry Date"],
    required: false,
  },
  {
    field: "bucket",
    aliases: ["Bucket", "DPD Bucket", "Overdue Category"],
  },
];

export async function parseLoans(
  buffer: Buffer,
  options: ParseLoanBalanceOptions = { dryRun: true }
): Promise<ParseResult<GoldLoanAccount>> {
  const extracted = await extractSpreadsheetRows(buffer, LOAN_BALANCE_COLUMNS);
  const missingRequired = LOAN_BALANCE_COLUMNS.filter(
    (column) => column.required !== false && !extracted.columnMap.has(column.field)
  ).map((column) => column.field);

  if (missingRequired.length > 0) {
    return {
      parsed: [],
      skipped: [
        {
          row: extracted.headerRow,
          reason: `missing required column: ${missingRequired.join(", ")}`,
        },
      ],
      errors: missingRequired.map((field) => ({ field, count: 1 })),
    };
  }

  const parsed: GoldLoanAccount[] = [];
  const skipped: ParseResult<GoldLoanAccount>["skipped"] = [];
  const fieldErrors: string[] = [];

  for (const row of extracted.rows) {
    const rowErrors: string[] = [];

    const accountNumber = readString(row, extracted.columnMap, "account_number", rowErrors);
    const customerName = readString(row, extracted.columnMap, "customer_name", rowErrors);
    const branch = readString(row, extracted.columnMap, "branch", rowErrors);
    const principalOutstanding = readNumber(
      row,
      extracted.columnMap,
      "principal_outstanding",
      rowErrors
    );
    const goldWeightGrams = readNumber(
      row,
      extracted.columnMap,
      "gold_weight_grams",
      rowErrors
    );
    const ltvPercent = readNumber(row, extracted.columnMap, "ltv_percent", rowErrors);
    const interestRate = readNumber(row, extracted.columnMap, "interest_rate", rowErrors);
    const disbursementDate = readDate(
      row,
      extracted.columnMap,
      "disbursement_date",
      rowErrors
    );
    const maturityDate = readOptionalDate(
      row,
      extracted.columnMap,
      "maturity_date",
      rowErrors
    );
    const bucket = normalizeLoanBucket(
      getMappedValue(row, extracted.columnMap, "bucket")
    );

    if (!bucket) rowErrors.push("bucket");

    if (
      rowErrors.length > 0 ||
      !accountNumber ||
      !customerName ||
      !branch ||
      principalOutstanding === null ||
      goldWeightGrams === null ||
      ltvPercent === null ||
      interestRate === null ||
      !disbursementDate
    ) {
      fieldErrors.push(...rowErrors);
      skipped.push({
        row: row.rowNumber,
        reason: `invalid fields: ${[...new Set(rowErrors)].join(", ")}`,
      });
      continue;
    }

    if (!bucket) {
      continue;
    }

    const normalizedBucket = bucket;

    parsed.push({
      id: `dry_run_${row.rowNumber}`,
      companyId: options.companyId ?? "",
      portfolioId: options.portfolioId ?? "",
      uploadId: options.uploadId ?? "",
      accountNumber,
      customerName,
      branch,
      principalOutstanding,
      goldWeightGrams,
      ltvPercent,
      interestRate,
      disbursementDate,
      maturityDate,
      status: "ACTIVE",
      bucket: normalizedBucket,
      isNpa: normalizedBucket === LoanBucket.DPD_90_PLUS,
      createdAt: new Date(0),
      updatedAt: new Date(0),
      deletedAt: null,
    });
  }

  if (options.dryRun === false && parsed.length > 0) {
    if (!options.companyId || !options.portfolioId || !options.uploadId) {
      throw new Error("companyId, portfolioId, and uploadId are required for DB writes.");
    }

    const companyId = options.companyId;
    const portfolioId = options.portfolioId;
    const uploadId = options.uploadId;

    await prisma.goldLoanAccount.createMany({
      data: parsed.map(({ id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...row }) => ({
        ...row,
        companyId,
        portfolioId,
        uploadId,
      })),
      skipDuplicates: true,
    });
  }

  return {
    parsed,
    skipped,
    errors: createErrorSummary(fieldErrors),
  };
}

export function normalizeLoanBucket(value: unknown): LoanBucket | null {
  const text = coerceRequiredString(value)
    ?.toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (!text) return null;

  const aliases: Record<string, LoanBucket> = {
    CURRENT: LoanBucket.CURRENT,
    REGULAR: LoanBucket.CURRENT,
    ZERO: LoanBucket.CURRENT,
    "0": LoanBucket.CURRENT,
    DPD_0_30: LoanBucket.DPD_0_30,
    "0_30": LoanBucket.DPD_0_30,
    DPD_31_60: LoanBucket.DPD_31_60,
    "31_60": LoanBucket.DPD_31_60,
    DPD_61_90: LoanBucket.DPD_61_90,
    "61_90": LoanBucket.DPD_61_90,
    DPD_90_PLUS: LoanBucket.DPD_90_PLUS,
    "90_PLUS": LoanBucket.DPD_90_PLUS,
    "90": LoanBucket.DPD_90_PLUS,
    NPA: LoanBucket.DPD_90_PLUS,
  };

  return aliases[text] ?? null;
}

function readString(
  row: SpreadsheetRow,
  columnMap: Map<LoanBalanceField, number>,
  field: LoanBalanceField,
  errors: string[]
): string | null {
  const value = coerceRequiredString(getMappedValue(row, columnMap, field));
  if (!value) errors.push(field);
  return value;
}

function readNumber(
  row: SpreadsheetRow,
  columnMap: Map<LoanBalanceField, number>,
  field: LoanBalanceField,
  errors: string[]
): number | null {
  const value = coerceNumber(getMappedValue(row, columnMap, field));
  if (value === null) errors.push(field);
  return value;
}

function readDate(
  row: SpreadsheetRow,
  columnMap: Map<LoanBalanceField, number>,
  field: LoanBalanceField,
  errors: string[]
): Date | null {
  const value = coerceDate(getMappedValue(row, columnMap, field));
  if (!value) errors.push(field);
  return value;
}

function readOptionalDate(
  row: SpreadsheetRow,
  columnMap: Map<LoanBalanceField, number>,
  field: LoanBalanceField,
  errors: string[]
): Date | null {
  const raw = getMappedValue(row, columnMap, field);
  if (raw === undefined || coerceRequiredString(raw) === null) return null;

  const value = coerceDate(raw);
  if (!value) errors.push(field);
  return value;
}
