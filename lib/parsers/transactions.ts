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
import { TxnType, type GoldLoanTxn } from "@prisma/client";

type TransactionField =
  | "account_number"
  | "txn_date"
  | "txn_type"
  | "amount"
  | "balance_after";

type ExistingAccount = {
  id: string;
  accountNumber: string;
};

export type ParseTransactionOptions = {
  dryRun?: boolean;
  companyId: string;
  existingAccounts?: ExistingAccount[];
};

export const TRANSACTION_COLUMNS: ParserColumn<TransactionField>[] = [
  {
    field: "account_number",
    aliases: ["Loan A/C No", "Account Number", "A/C No"],
  },
  {
    field: "txn_date",
    aliases: ["Transaction Date", "Txn Date", "Date", "Value Date"],
  },
  {
    field: "txn_type",
    aliases: ["Transaction Type", "Txn Type", "Nature", "Type"],
  },
  {
    field: "amount",
    aliases: ["Amount", "Txn Amount", "Credit/Debit Amount"],
  },
  {
    field: "balance_after",
    aliases: ["Balance After", "Outstanding After", "Closing Balance"],
  },
];

export async function parseTransactions(
  buffer: Buffer,
  options: ParseTransactionOptions
): Promise<ParseResult<GoldLoanTxn>> {
  const extracted = await extractSpreadsheetRows(buffer, TRANSACTION_COLUMNS);
  const missingRequired = TRANSACTION_COLUMNS.filter(
    (column) => !extracted.columnMap.has(column.field)
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

  const accounts = await getAccountLookup(options);
  const parsed: GoldLoanTxn[] = [];
  const skipped: ParseResult<GoldLoanTxn>["skipped"] = [];
  const fieldErrors: string[] = [];

  for (const row of extracted.rows) {
    const rowErrors: string[] = [];
    const accountNumber = readString(row, extracted.columnMap, "account_number", rowErrors);
    const txnDate = readDate(row, extracted.columnMap, "txn_date", rowErrors);
    const txnType = normalizeTxnType(getMappedValue(row, extracted.columnMap, "txn_type"));
    const amount = readNumber(row, extracted.columnMap, "amount", rowErrors);
    const balanceAfter = readNumber(
      row,
      extracted.columnMap,
      "balance_after",
      rowErrors
    );

    if (!txnType) rowErrors.push("txn_type");

    const accountId = accountNumber ? accounts.get(accountNumber) : undefined;
    if (accountNumber && !accountId) {
      skipped.push({ row: row.rowNumber, reason: "account not found" });
      continue;
    }

    if (
      rowErrors.length > 0 ||
      !accountId ||
      !txnDate ||
      !txnType ||
      amount === null ||
      balanceAfter === null
    ) {
      fieldErrors.push(...rowErrors);
      skipped.push({
        row: row.rowNumber,
        reason: `invalid fields: ${[...new Set(rowErrors)].join(", ")}`,
      });
      continue;
    }

    parsed.push({
      id: `dry_run_${row.rowNumber}`,
      accountId,
      txnDate,
      txnType,
      amount,
      balanceAfter,
      notes: null,
      createdAt: new Date(0),
    });
  }

  if (options.dryRun === false && parsed.length > 0) {
    await prisma.goldLoanTxn.createMany({
      data: parsed.map(({ id: _id, createdAt: _createdAt, ...txn }) => txn),
    });
  }

  return {
    parsed,
    skipped,
    errors: createErrorSummary(fieldErrors),
  };
}

export function normalizeTxnType(value: unknown): TxnType | null {
  const text = coerceRequiredString(value)
    ?.toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) return null;

  const aliases: Record<string, TxnType> = {
    DISBURSAL: TxnType.DISBURSEMENT,
    DISBURSEMENT: TxnType.DISBURSEMENT,
    "LOAN DISBURSAL": TxnType.DISBURSEMENT,
    COLLECTION: TxnType.COLLECTION,
    REPAYMENT: TxnType.COLLECTION,
    "PAYMENT RECEIVED": TxnType.COLLECTION,
    INTEREST: TxnType.INTEREST_ACCRUAL,
    "INTEREST ACCRUAL": TxnType.INTEREST_ACCRUAL,
    "INT CHARGE": TxnType.INTEREST_ACCRUAL,
    PENALTY: TxnType.PENALTY,
    "PENAL CHARGE": TxnType.PENALTY,
    CLOSURE: TxnType.CLOSURE,
    "LOAN CLOSURE": TxnType.CLOSURE,
    CLOSED: TxnType.CLOSURE,
  };

  return aliases[text] ?? null;
}

async function getAccountLookup(
  options: ParseTransactionOptions
): Promise<Map<string, string>> {
  const accounts =
    options.existingAccounts ??
    (await prisma.goldLoanAccount.findMany({
      where: {
        companyId: options.companyId,
        deletedAt: null,
      },
      select: {
        id: true,
        accountNumber: true,
      },
    }));

  return new Map(accounts.map((account) => [account.accountNumber, account.id]));
}

function readString(
  row: SpreadsheetRow,
  columnMap: Map<TransactionField, number>,
  field: TransactionField,
  errors: string[]
): string | null {
  const value = coerceRequiredString(getMappedValue(row, columnMap, field));
  if (!value) errors.push(field);
  return value;
}

function readNumber(
  row: SpreadsheetRow,
  columnMap: Map<TransactionField, number>,
  field: TransactionField,
  errors: string[]
): number | null {
  const value = coerceNumber(getMappedValue(row, columnMap, field));
  if (value === null) errors.push(field);
  return value;
}

function readDate(
  row: SpreadsheetRow,
  columnMap: Map<TransactionField, number>,
  field: TransactionField,
  errors: string[]
): Date | null {
  const value = coerceDate(getMappedValue(row, columnMap, field));
  if (!value) errors.push(field);
  return value;
}
