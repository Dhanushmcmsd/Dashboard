import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api-utils";

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(["MANAGEMENT"]);
    if (auth.error) {
      return errorResponse(auth.error, auth.status);
    }

    const { searchParams } = new URL(req.url);
    const branch = searchParams.get("branch");

    if (!branch) {
      return errorResponse("Branch is required", 400);
    }

    const latestUpload = await prisma.upload.findFirst({
      where: { branch },
      orderBy: { uploadedAt: "desc" },
      include: { user: true },
    });

    if (!latestUpload || !latestUpload.rawData) {
      return successResponse(null);
    }

    const data = {
      ...latestUpload.rawData as object,
      uploadedBy: latestUpload.user.name,
      uploadedAt: latestUpload.uploadedAt.toISOString(),
      fileName: latestUpload.fileName,
    };

    return successResponse(data);
  } catch (error) {
    console.error("Branch dashboard error:", error);
    return errorResponse("Internal server error", 500);
  }
}
