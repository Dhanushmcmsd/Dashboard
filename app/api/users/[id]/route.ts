import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { successResponse, errorResponse, validationError } from "@/lib/api-utils";
import { UpdateUserSchema } from "@/lib/validations";
import {
  sendDeactivationEmail,
  sendReactivationEmail,
  sendApprovalWithPasswordEmail,
} from "@/lib/email";
import { createAuditLog } from "@/lib/audit";
import crypto from "crypto";
import bcrypt from "bcryptjs";

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

    // Handle isActive transitions
    if (existingUser.isActive !== user.isActive) {
      if (user.isActive) {
        // First-time approval: user never set a password → send set-password link
        if (!existingUser.passwordSet) {
          const rawToken  = crypto.randomBytes(32).toString("hex");
          const tokenHash = await bcrypt.hash(rawToken, 10);
          const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 h

          await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
          await prisma.passwordResetToken.create({
            data: { userId: user.id, tokenHash, expiresAt },
          });

          const setPasswordLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${rawToken}&uid=${user.id}`;
          await sendApprovalWithPasswordEmail(user.email, user.name, setPasswordLink);
        } else {
          // Re-activation of an existing user who already has a password
          await sendReactivationEmail(user.email, user.name);
        }
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
