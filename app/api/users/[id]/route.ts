import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, validationError } from "@/lib/api-utils";
import { UpdateUserSchema } from "@/lib/validations";
import { HTTP_STATUS } from "@/lib/constants";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role: string }).role !== "ADMIN") return errorResponse("Forbidden", HTTP_STATUS.FORBIDDEN);
    const parsed = UpdateUserSchema.safeParse(await req.json());
    if (!parsed.success) return validationError(parsed.error);
    const user = await prisma.user.update({ where: { id: params.id }, data: parsed.data, select: { id: true, name: true, email: true, role: true, branches: true, isActive: true, createdAt: true } });
    return successResponse(user);
  } catch { return errorResponse("Failed to update user"); }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role: string }).role !== "ADMIN") return errorResponse("Forbidden", HTTP_STATUS.FORBIDDEN);
    await prisma.user.update({ where: { id: params.id }, data: { isActive: false } });
    return successResponse({ deactivated: true });
  } catch { return errorResponse("Failed to deactivate user"); }
}
