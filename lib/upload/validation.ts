import { FileType } from "@prisma/client";
import { fileTypeFromBuffer } from "file-type";

const MAX_BYTES = 20 * 1024 * 1024;

const ALLOWED_MIME: Record<string, FileType> = {
  "application/vnd.ms-excel": FileType.EXCEL,
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    FileType.EXCEL,
  "text/csv": FileType.CSV,
};

export type UploadValidationResult = {
  fileType: FileType;
  inferredExtension?: string;
};

/**
 * Validates upload size, declared MIME, file content, and business date.
 */
export async function validateUploadFile(
  file: File,
  asOnDateInput: string
): Promise<UploadValidationResult> {
  if (!file) {
    throw new Error("File is required.");
  }

  if (file.size > MAX_BYTES) {
    throw new Error("File too large. Maximum allowed size is 20 MB.");
  }

  const declaredMime = file.type;
  const mappedType = ALLOWED_MIME[declaredMime];
  if (!mappedType) {
    throw new Error("Unsupported file type.");
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const detected = await fileTypeFromBuffer(buffer);

  if (!detected) {
    if (mappedType === FileType.CSV) {
      const head = buffer.subarray(0, 1024).toString("utf8");
      if (!head.includes(",") && !head.includes(";") && !head.includes("\n")) {
        throw new Error("CSV file content does not look valid.");
      }
    } else {
      throw new Error("Could not determine file type from content.");
    }
  } else {
    const { mime } = detected;

    const mimeOk =
      (mappedType === FileType.EXCEL &&
        (mime === "application/vnd.ms-excel" ||
          mime ===
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
          mime === "application/zip")) ||
      (mappedType === FileType.CSV &&
        (mime === "text/plain" || mime === "text/csv"));

    if (!mimeOk) {
      throw new Error("File content does not match declared type.");
    }
  }

  if (!asOnDateInput) {
    throw new Error("as_on_date is required.");
  }

  const asOnDate = new Date(asOnDateInput);
  if (Number.isNaN(asOnDate.getTime())) {
    throw new Error("as_on_date is not a valid date.");
  }

  const now = new Date();
  if (asOnDate.getTime() > now.getTime()) {
    throw new Error("as_on_date must be in the past.");
  }

  return {
    fileType: mappedType,
    inferredExtension: detected?.ext,
  };
}
