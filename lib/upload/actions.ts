"use server";

import { prisma } from "@/lib/prisma";
import { withCompanyScope } from "@/lib/with-company-scope";
import type { SessionUser } from "@/types";
import { FileType, PortfolioType, UploadStatus } from "@prisma/client";
import { getStorageProvider } from "./storage";
import { setUploadStatus } from "./status-machine";
import { validateUploadFile } from "./validation";
import { processUpload } from "./processing-pipeline";

function assertPortfolioType(value: string): asserts value is PortfolioType {
  if (!Object.values(PortfolioType).includes(value as PortfolioType)) {
    throw new Error("portfolio_type is invalid");
  }
}

/**
 * Server-side upload entrypoint.
 * Creates a DataUpload record, validates file and date, writes to storage,
 * and updates status via the state machine.
 */
export async function createUpload(formData: FormData) {
  const file = formData.get("file");
  const asOnDateInput = formData.get("as_on_date");
  const portfolioTypeInput = formData.get("portfolio_type");
  const companySlug = formData.get("company_slug");

  if (!(file instanceof File)) {
    throw new Error("file is required");
  }
  if (typeof asOnDateInput !== "string") {
    throw new Error("as_on_date is required");
  }
  if (typeof portfolioTypeInput !== "string") {
    throw new Error("portfolio_type is required");
  }
  if (typeof companySlug !== "string") {
    throw new Error("company_slug is required");
  }

  assertPortfolioType(portfolioTypeInput);

  const user = (await withCompanyScope(companySlug)) as SessionUser;
  if (!user.companyId) {
    throw new Error("User has no company assigned.");
  }

  const portfolio = await prisma.portfolio.findFirst({
    where: {
      companyId: user.companyId,
      type: portfolioTypeInput,
      isActive: true,
    },
    select: { id: true },
  });

  if (!portfolio) {
    throw new Error("Portfolio not found for this company.");
  }

  const asOnDate = new Date(asOnDateInput);
  if (Number.isNaN(asOnDate.getTime())) {
    throw new Error("as_on_date is not a valid date.");
  }

  const upload = await prisma.dataUpload.create({
    data: {
      companyId: user.companyId,
      portfolioId: portfolio.id,
      fileType: FileType.EXCEL,
      fileName: file.name,
      asOnDate,
      status: UploadStatus.PENDING,
      uploadedById: user.userId,
    },
  });

  try {
    await setUploadStatus(upload.id, UploadStatus.PROCESSING);

    const { fileType } = await validateUploadFile(file, asOnDateInput);

    await prisma.dataUpload.update({
      where: { id: upload.id },
      data: { fileType },
    });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const storageKey = `${user.companyId}/${portfolio.id}/${upload.id}`;
    const storage = getStorageProvider();

    await storage.upload(storageKey, buffer);

    await setUploadStatus(upload.id, UploadStatus.SUCCESS);

    return prisma.dataUpload.findUniqueOrThrow({
      where: { id: upload.id },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed.";
    await setUploadStatus(upload.id, UploadStatus.FAILED, message);
    throw err;
  }
}

/**
 * Kicks off resumable server-side processing for a staged upload row.
 */
export async function runUploadProcessing(uploadId: string) {
  if (!uploadId) {
    throw new Error("uploadId is required");
  }
  return processUpload(uploadId);
}
