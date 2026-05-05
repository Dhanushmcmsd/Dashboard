# Processing Flow

## Happy Path Sequence

```text
Client / Worker
    |
    | 1) processUpload(upload_id)
    v
Upload Pipeline (server)
    |
    | 2) setUploadStatus(upload_id, PROCESSING)
    |
    | 3) storage.download(companyId/portfolioId/uploadId)
    |
    | 4) detect statement type (Loan Balance / Transaction)
    |
    | 5) run parser and persist rows (idempotent guard first)
    |      - Loan Balance -> GoldLoanAccount
    |      - Transaction  -> GoldLoanTxn
    |
    | 6) write skipped rows into UploadProcessingError
    |
    | 7) update DataUpload rowCount/skippedRowCount/errorMessage
    |
    | 8) setUploadStatus -> SUCCESS / PARTIAL_SUCCESS / FAILED
    v
Database
```

## Failure-Recovery Runbook

When an upload is stuck in `PROCESSING`:

1. Check when it last updated.
   - Query `DataUpload.updatedAt` and `DataUpload.errorMessage`.
2. Check parser-level row errors.
   - Query `UploadProcessingError` for the upload id.
3. If the worker crashed and no terminal status was written:
   - Move status from `PROCESSING` to `FAILED` manually once (or use retry job policy).
4. Retry by moving `FAILED -> PENDING` and call `processUpload(uploadId)` again.
5. If retries keep failing on the same row/field:
   - Inspect `UploadProcessingError.rowNumber` and `field`.
   - Fix source sheet and re-upload.

## Idempotency Guarantee

The pipeline prevents duplicates on rerun:

- **Loan balance uploads**
  - Guard: if any `GoldLoanAccount` already exists for `uploadId`, parsing/writes are skipped.
  - `DataUpload` gets an idempotent-skip message and status moves to `SUCCESS`.

- **Transaction uploads**
  - Guard: rows written with notes marker `upload:<uploadId>`.
  - On rerun, existing marker rows are detected and insert is skipped.

- **Status updates**
  - Status transitions are enforced by `setUploadStatus` state machine.
  - Invalid transitions are rejected to avoid inconsistent lifecycle states.
