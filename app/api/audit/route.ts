import { requireAuth } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(["ADMIN", "SUPER_ADMIN"]);
    if (auth.error || !auth.user) {
      return errorResponse(auth.error || "Unauthorized", auth.status || 401);
    }

    const { searchParams } = new URL(req.url);
    const page   = Math.max(1, parseInt(searchParams.get("page")   || "1",  10));
    const limit  = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25", 10)));
    const action = searchParams.get("action") || "";
    const userId = searchParams.get("userId") || "";

    const where: any = {};
    if (action) where.action = action;
    if (userId) where.userId = userId;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip:  (page - 1) * limit,
        take:  limit,
        include: {
          user: { select: { name: true, email: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return successResponse({
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Audit log fetch error:", error);
    return errorResponse("Internal server error", 500);
  }
}
