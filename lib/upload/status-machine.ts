import { prisma } from "@/lib/prisma";
import { UploadStatus } from "@prisma/client";

const ALLOWED_TRANSITIONS: Record<UploadStatus, UploadStatus[]> = {
  [UploadStatus.PENDING]: [UploadStatus.PROCESSING],
  [UploadStatus.PROCESSING]: [
    UploadStatus.SUCCESS,
    UploadStatus.PARTIAL_SUCCESS,
    UploadStatus.FAILED,
  ],
  [UploadStatus.SUCCESS]: [],
  [UploadStatus.PARTIAL_SUCCESS]: [UploadStatus.PENDING],
  [UploadStatus.FAILED]: [UploadStatus.PENDING],
};

/**
 * Enforces DataUpload status changes as an explicit state machine.
 */
export async function setUploadStatus(
  id: string,
  newStatus: UploadStatus,
  errorMessage?: string | null
) {
  const existing = await prisma.dataUpload.findUnique({
    where: { id },
    select: { status: true },
  });

  if (!existing) {
    throw new Error(`Upload ${id} not found`);
  }

  const allowedNext = ALLOWED_TRANSITIONS[existing.status] ?? [];
  if (!allowedNext.includes(newStatus)) {
    throw new Error(
      `Invalid upload status transition: ${existing.status} -> ${newStatus}`
    );
  }

  return prisma.dataUpload.update({
    where: { id },
    data: {
      status: newStatus,
      errorMessage:
        newStatus === UploadStatus.FAILED ? errorMessage ?? null : null,
    },
  });
}
