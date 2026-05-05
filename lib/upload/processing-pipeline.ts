import { prisma } from "@/lib/prisma";
import {
  LOAN_BALANCE_COLUMNS,
  parseLoans,
  type ParseLoanBalanceOptions,
} from "@/lib/parsers/loan-balance";
import {
  TRANSACTION_COLUMNS,
  parseTransactions,
  type ParseTransactionOptions,
} from "@/lib/parsers/transactions";
import { buildFuzzyColumnMap } from "@/lib/parsers/spreadsheet";
import { getStorageProvider } from "@/lib/upload/storage";
import { setUploadStatus } from "@/lib/upload/status-machine";
import { FileType, UploadStatus } from "@prisma/client";
import * as XLSX from "xlsx";

type StatementType = "LOAN_BALANCE" | "TRANSACTION";

type ProcessUploadResult = {
  uploadId: string;
  statementType: StatementType;
  parsedCount: number;
  skippedCount: number;
  status: UploadStatus;
  idempotentSkip: boolean;
};

/**
 * Resumable processing entrypoint.
 *
 * Pipeline:
 * 1) mark upload as PROCESSING
 * 2) fetch file bytes from storage
 * 3) detect statement type
 * 4) parse + persist
 * 5) mark SUCCESS / PARTIAL_SUCCESS / FAILED
 */
export async function processUpload(uploadId: string): Promise<ProcessUploadResult> {
  const upload = await prisma.dataUpload.findUnique({
    where: { id: uploadId },
    select: {
      id: true,
      companyId: true,
      portfolioId: true,
      status: true,
      fileName: true,
      asOnDate: true,
      fileType: true,
    },
  });

  if (!upload) {
    throw new Error(`Upload ${uploadId} not found`);
  }

  if (upload.fileType !== FileType.EXCEL && upload.fileType !== FileType.CSV) {
    throw new Error("Processing pipeline supports EXCEL/CSV uploads only.");
  }

  const storageKey = `${upload.companyId}/${upload.portfolioId}/${upload.id}`;
  const storage = getStorageProvider();

  await setUploadStatus(upload.id, UploadStatus.PROCESSING);

  try {
    const buffer = await storage.download(storageKey);
    const statementType = detectStatementType(buffer);

    if (statementType === "LOAN_BALANCE") {
      const existingRows = await prisma.goldLoanAccount.count({
        where: { uploadId: upload.id },
      });
      if (existingRows > 0) {
        await prisma.dataUpload.update({
          where: { id: upload.id },
          data: {
            rowCount: existingRows,
            skippedRowCount: 0,
            errorMessage: "Idempotent skip: rows already processed for this upload.",
          },
        });
        await setUploadStatus(upload.id, UploadStatus.SUCCESS);
        return {
          uploadId: upload.id,
          statementType,
          parsedCount: existingRows,
          skippedCount: 0,
          status: UploadStatus.SUCCESS,
          idempotentSkip: true,
        };
      }

      const options: ParseLoanBalanceOptions = {
        dryRun: false,
        companyId: upload.companyId,
        portfolioId: upload.portfolioId,
        uploadId: upload.id,
      };
      const result = await parseLoans(buffer, options);

      await writeProcessingErrors(upload.id, result.skipped);

      const status =
        result.parsed.length > 0 && result.skipped.length > 0
          ? UploadStatus.PARTIAL_SUCCESS
          : result.parsed.length > 0
            ? UploadStatus.SUCCESS
            : UploadStatus.FAILED;

      await prisma.dataUpload.update({
        where: { id: upload.id },
        data: {
          rowCount: result.parsed.length,
          skippedRowCount: result.skipped.length,
          errorMessage:
            status === UploadStatus.FAILED
              ? buildFailureMessage(result.skipped, result.errors)
              : result.skipped.length > 0
                ? `Partial success: ${result.skipped.length} rows skipped.`
                : null,
        },
      });

      await setUploadStatus(
        upload.id,
        status,
        status === UploadStatus.FAILED
          ? buildFailureMessage(result.skipped, result.errors)
          : undefined
      );

      return {
        uploadId: upload.id,
        statementType,
        parsedCount: result.parsed.length,
        skippedCount: result.skipped.length,
        status,
        idempotentSkip: false,
      };
    }

    const marker = `upload:${upload.id}`;
    const existingTxns = await prisma.goldLoanTxn.count({
      where: {
        notes: {
          startsWith: marker,
        },
      },
    });
    if (existingTxns > 0) {
      await prisma.dataUpload.update({
        where: { id: upload.id },
        data: {
          rowCount: existingTxns,
          skippedRowCount: 0,
          errorMessage: "Idempotent skip: transactions already processed for this upload.",
        },
      });
      await setUploadStatus(upload.id, UploadStatus.SUCCESS);
      return {
        uploadId: upload.id,
        statementType,
        parsedCount: existingTxns,
        skippedCount: 0,
        status: UploadStatus.SUCCESS,
        idempotentSkip: true,
      };
    }

    const options: ParseTransactionOptions = {
      dryRun: true,
      companyId: upload.companyId,
    };
    const parsed = await parseTransactions(buffer, options);

    await writeProcessingErrors(upload.id, parsed.skipped);

    if (parsed.parsed.length > 0) {
      await prisma.goldLoanTxn.createMany({
        data: parsed.parsed.map((txn) => ({
          accountId: txn.accountId,
          txnDate: txn.txnDate,
          txnType: txn.txnType,
          amount: txn.amount,
          balanceAfter: txn.balanceAfter,
          notes: `${marker};source:${upload.fileName}`,
        })),
      });
    }

    const status =
      parsed.parsed.length > 0 && parsed.skipped.length > 0
        ? UploadStatus.PARTIAL_SUCCESS
        : parsed.parsed.length > 0
          ? UploadStatus.SUCCESS
          : UploadStatus.FAILED;

    await prisma.dataUpload.update({
      where: { id: upload.id },
      data: {
        rowCount: parsed.parsed.length,
        skippedRowCount: parsed.skipped.length,
        errorMessage:
          status === UploadStatus.FAILED
            ? buildFailureMessage(parsed.skipped, parsed.errors)
            : parsed.skipped.length > 0
              ? `Partial success: ${parsed.skipped.length} rows skipped.`
              : null,
      },
    });

    await setUploadStatus(
      upload.id,
      status,
      status === UploadStatus.FAILED
        ? buildFailureMessage(parsed.skipped, parsed.errors)
        : undefined
    );

    return {
      uploadId: upload.id,
      statementType,
      parsedCount: parsed.parsed.length,
      skippedCount: parsed.skipped.length,
      status,
      idempotentSkip: false,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload processing failed.";
    await prisma.dataUpload.update({
      where: { id: upload.id },
      data: { errorMessage: message },
    });
    await setUploadStatus(upload.id, UploadStatus.FAILED, message);
    throw error;
  }
}

function detectStatementType(buffer: Buffer): StatementType {
  const rows = readRows(buffer);
  const header = rows[0] ?? [];

  const loanMatches = buildFuzzyColumnMap(header, LOAN_BALANCE_COLUMNS).size;
  const txnMatches = buildFuzzyColumnMap(header, TRANSACTION_COLUMNS).size;

  return loanMatches >= txnMatches ? "LOAN_BALANCE" : "TRANSACTION";
}

function readRows(buffer: Buffer): unknown[][] {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true, raw: true });
  const firstSheet = workbook.SheetNames[0];
  if (!firstSheet) return [];
  return XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[firstSheet], {
    header: 1,
    blankrows: false,
    raw: true,
  });
}

function buildFailureMessage(
  skipped: Array<{ row: number; reason: string }>,
  errors: Array<{ field: string; count: number }>
): string {
  const rowInfo = skipped[0] ? `row ${skipped[0].row}: ${skipped[0].reason}` : "no valid rows";
  const fieldInfo = errors[0] ? `${errors[0].field}(${errors[0].count})` : "unknown field";
  return `Processing failed at ${rowInfo}; field summary: ${fieldInfo}`;
}

async function writeProcessingErrors(
  uploadId: string,
  skipped: Array<{ row: number; reason: string }>
): Promise<void> {
  if (skipped.length === 0) return;

  await prisma.uploadProcessingError.createMany({
    data: skipped.map((entry) => {
      const [fieldPart] = entry.reason.split(":");
      return {
        uploadId,
        rowNumber: entry.row,
        field: fieldPart || null,
        message: entry.reason,
      };
    }),
  });
}
