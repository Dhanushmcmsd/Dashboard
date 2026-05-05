import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorResponse, successResponse } from "@/lib/api-utils";
import type { SessionUser } from "@/types";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return errorResponse("Unauthorized", 401);
    }

    const user = session.user as SessionUser;
    if (!user.companyId) {
      return errorResponse("No company assigned.", 403);
    }

    const rows = await prisma.dataUpload.findMany({
      where: {
        companyId: user.companyId,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        fileName: true,
        fileType: true,
        asOnDate: true,
        status: true,
        rowCount: true,
        skippedRowCount: true,
        createdAt: true,
      },
    });

    return successResponse(
      rows.map((row) => ({
        ...row,
        asOnDate: row.asOnDate.toISOString(),
        createdAt: row.createdAt.toISOString(),
      }))
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load upload history.";
    return errorResponse(message, 500);
  }
}
