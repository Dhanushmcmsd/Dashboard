import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { BRANCHES } from "@/lib/constants";
import type { BranchName, SessionUser } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as SessionUser).role !== "MANAGEMENT") return errorResponse("Forbidden", 403);
    const branch = req.nextUrl.searchParams.get("branch") as BranchName | null;
    if (!branch || !BRANCHES.includes(branch)) return errorResponse("Invalid branch", 400);
    const upload = await prisma.upload.findFirst({ where: { branch }, orderBy: { uploadedAt: "desc" }, select: { id: true, branch: true, fileType: true, fileName: true, rawData: true, uploadedAt: true, dateKey: true, user: { select: { name: true } } } });
    return successResponse(upload ? { ...upload, uploadedByName: upload.user.name } : null);
  } catch { return errorResponse("Failed to fetch branch data"); }
}
