# Upload Architecture

## 1. End-to-end upload sequence

```text
Client (browser)
    |
    | 1. Submits formData:
    |      - file
    |      - company_slug
    |      - portfolio_type
    |      - as_on_date
    v
Next.js server action: createUpload(formData)
    |
    | 2. withCompanyScope(company_slug)
    |      - validates session
    |      - enforces tenant isolation
    |
    | 3. prisma.dataUpload.create()
    |      - status = PENDING
    |      - stores companyId, portfolioId, asOnDate, uploadedById
    |
    | 4. setUploadStatus(id, PROCESSING)
    |
    | 5. validateUploadFile(file, as_on_date)
    |      - size <= 20 MB
    |      - MIME in allowlist
    |      - magic bytes match expected type
    |      - as_on_date is a valid past date
    |
    | 6. storage.upload(key, buffer)
    |      - StorageProvider implementation (local/S3/etc.)
    |
    | 7. setUploadStatus(id, SUCCESS) or FAILED on error
    v
Database (DataUpload) + Storage (Local / S3 / ...)
```

## 2. Status state machine

```text
States:
  PENDING
  PROCESSING
  SUCCESS
  FAILED

Allowed transitions:

  PENDING    -----------> PROCESSING
                             |
                             |-----> SUCCESS
                             |
                             `-----> FAILED

  FAILED     -----------> PENDING   (retry)

  SUCCESS    -----------> (no outgoing transitions)
```

Any other transition throws in `setUploadStatus(id, newStatus)`.

## 3. StorageProvider interface

```ts
export interface StorageProvider {
  upload(key: string, buffer: Buffer): Promise<void>;
  getSignedUrl(key: string, ttlSeconds: number): Promise<string>;
}
```

- `upload(key, buffer)` writes the raw file bytes to the backing store.
- `key` is usually derived from `companyId/portfolioId/uploadId`.
- `getSignedUrl(key, ttlSeconds)` returns a short-lived URL for accessing the file.
- Implementations must not return raw storage paths directly.
- In dev, `LocalStorageProvider` returns `/api/uploads/file?key=...&token=...&expires=...`.
- In production, replace the local adapter with a pre-signed object URL provider such as S3 or GCS.

All client-facing code must use `getSignedUrl` instead of constructing storage URLs manually.

## 4. Manual test notes

Install dependencies with `npm install` before running the app.

Happy path:

- Wire `createUpload` to a test form or server action test.
- Upload a small `.xlsx` or `.csv`.
- Verify `DataUpload.status` eventually becomes `SUCCESS`.
- Verify `DataUpload.fileType` matches `EXCEL` or `CSV`.

Validation failure:

- Upload a file over 20 MB and expect `FAILED` with an error message.
- Upload a non-allowed MIME such as `image/png` and expect `FAILED` with an error message.

State machine:

- Set a `DataUpload` row to `PENDING`.
- Call `setUploadStatus(id, UploadStatus.PROCESSING)` and expect success.
- Call `setUploadStatus(id, UploadStatus.SUCCESS)` and expect success.
- Try `setUploadStatus(id, UploadStatus.PENDING)` from `SUCCESS` and expect an error.

Storage provider:

```ts
const storage = getStorageProvider();
await storage.upload("test/key.txt", Buffer.from("hello"));
const url = await storage.getSignedUrl("test/key.txt", 300);
console.log(url);
```

Confirm the file is written to `/tmp/uploads/test/key.txt` or `LOCAL_UPLOAD_DIR`,
and the URL is not a raw filesystem path.
