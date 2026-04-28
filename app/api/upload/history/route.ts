import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-utils";
import type { SessionUser } from "@/types";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return errorResponse("Unauthorized", 401);
    const user = session.user as SessionUser;
    const dbUser = await prisma.user.findUnique({ where: { email: user.email }, select: { id: true } });
    if (!dbUser) return errorResponse("User not found", 401);
    const uploads = await prisma.upload.findMany({ where: { uploadedBy: dbUser.id }, select: { id: true, branch: true, fileType: true, fileName: true, uploadedAt: true, dateKey: true, monthKey: true, user: { select: { name: true } } }, orderBy: { uploadedAt: "desc" }, take: 50 });
    return successResponse(uploads.map((u) => ({ ...u, uploadedByName: u.user.name })));
  } catch { return errorResponse("Failed to fetch upload history"); }
}
