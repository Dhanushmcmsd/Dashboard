import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { UploadRecord } from "@/types";

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(["EMPLOYEE"]);
    if (auth.error) {
      return errorResponse(auth.error, auth.status);
    }

    const { searchParams } = new URL(req.url);
    const branch = searchParams.get("branch");

    const where: any = { uploadedBy: auth.user.id };
    if (branch && auth.user.branches.includes(branch)) {
      where.branch = branch;
    }

    const uploads = await prisma.upload.findMany({
      where,
      orderBy: { uploadedAt: "desc" },
      take: 50,
      include: { user: true },
    });

    const formatted: UploadRecord[] = uploads.map((u) => ({
      id: u.id,
      branch: u.branch,
      fileType: u.fileType,
      fileName: u.fileName,
      uploadedAt: u.uploadedAt.toISOString(),
      dateKey: u.dateKey,
      monthKey: u.monthKey,
      uploadedByName: u.user.name,
    }));

    return successResponse(formatted);
  } catch (error) {
    console.error("Upload history error:", error);
    return errorResponse("Internal server error", 500);
  }
}
