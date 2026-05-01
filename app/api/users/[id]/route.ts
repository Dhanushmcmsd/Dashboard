import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { successResponse, errorResponse, validationError } from "@/lib/api-utils";
import { UpdateUserSchema } from "@/lib/validations";
import { sendDeactivationEmail, sendReactivationEmail } from "@/lib/email";
import { createAuditLog } from "@/lib/audit";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(["ADMIN"]);
    if (auth.error) {
      return errorResponse(auth.error, auth.status);
    }

    const resolvedParams = await params;
    if (resolvedParams.id === auth.user!.id)
      return errorResponse("Cannot modify your own account", 403);

    const body = await req.json();
    const result = UpdateUserSchema.safeParse(body);
    if (!result.success) {
      return validationError(result.error);
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!existingUser) {
      return errorResponse("User not found", 404);
    }

    const user = await prisma.user.update({
      where: { id: resolvedParams.id },
      data: result.data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        branches: true,
        isActive: true,
        passwordSet: true,
      },
    });

    // Determine audit action: ROLE_CHANGED takes priority, else USER_UPDATED
    const roleChanged = result.data.role && result.data.role !== existingUser.role;
    const auditAction = roleChanged ? "ROLE_CHANGED" : "USER_UPDATED";

    createAuditLog({
      userId: auth.user!.id,
      action: auditAction,
      resource: "User",
      resourceId: user.id,
      metadata: {
        targetEmail: user.email,
        ...(roleChanged ? { oldRole: existingUser.role, newRole: user.role } : {}),
        changedFields: Object.keys(result.data),
      },
    });

    // Send emails based on isActive changes
    if (existingUser.isActive !== user.isActive) {
      if (user.isActive) {
        await sendReactivationEmail(user.email, user.name);
      } else {
        await sendDeactivationEmail(user.email, user.name);
      }
    }

    return successResponse(user);
  } catch (error) {
    console.error("Update user error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(["ADMIN"]);
    if (auth.error) {
      return errorResponse(auth.error, auth.status);
    }

    const resolvedParams = await params;
    if (resolvedParams.id === auth.user!.id)
      return errorResponse("Cannot deactivate your own account", 403);

    const user = await prisma.user.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!user) {
      return errorResponse("User not found", 404);
    }

    // Soft delete
    await prisma.user.update({
      where: { id: resolvedParams.id },
      data: { isActive: false },
    });

    createAuditLog({
      userId: auth.user!.id,
      action: "USER_DELETED",
      resource: "User",
      resourceId: user.id,
      metadata: { targetEmail: user.email, targetName: user.name },
    });

    if (user.isActive) {
      await sendDeactivationEmail(user.email, user.name);
    }

    return successResponse({ success: true, message: "User deactivated" });
  } catch (error) {
    console.error("Delete user error:", error);
    return errorResponse("Internal server error", 500);
  }
}
