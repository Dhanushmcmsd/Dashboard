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

/** Resolve app base URL — never returns undefined */
function getBaseUrl(req: Request): string {
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL.replace(/\/$/, "");
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  // Fallback: derive from the incoming request
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

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
        if (!existingUser.passwordSet) {
          // First-time approval: generate secure token and email set-password link
          try {
            const rawToken  = crypto.randomBytes(32).toString("hex");
            const tokenHash = await bcrypt.hash(rawToken, 10);
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

            await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
            await prisma.passwordResetToken.create({
              data: { userId: user.id, tokenHash, expiresAt },
            });

            // BUG FIX 1: use getBaseUrl() — never "undefined/reset-password"
            // BUG FIX 2: path is /reset-password (the only page that exists)
            const baseUrl = getBaseUrl(req);
            const setPasswordLink = `${baseUrl}/reset-password?token=${rawToken}&uid=${user.id}`;

            // BUG FIX 3: wrapped in try/catch — email failure is non-fatal,
            // user is already approved in DB so approval is not lost
            await sendApprovalWithPasswordEmail(user.email, user.name, setPasswordLink);
            console.info(`[approval] Set-password email sent to ${user.email}`);
          } catch (emailErr) {
            console.error(`[approval] Failed to send set-password email to ${user.email}:`, emailErr);
            // Don't return error — user is approved, admin should retry sending the link manually
          }
        } else {
          // Re-activation of user who already has a password
          try {
            await sendReactivationEmail(user.email, user.name);
          } catch (emailErr) {
            console.error(`[approval] Failed to send reactivation email to ${user.email}:`, emailErr);
          }
        }
      } else {
        try {
          await sendDeactivationEmail(user.email, user.name);
        } catch (emailErr) {
          console.error(`[approval] Failed to send deactivation email to ${user.email}:`, emailErr);
        }
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
      try {
        await sendDeactivationEmail(user.email, user.name);
      } catch (emailErr) {
        console.error(`[delete] Failed to send deactivation email to ${user.email}:`, emailErr);
      }
    }

    return successResponse({ success: true, message: "User deactivated" });
  } catch (error) {
    console.error("Delete user error:", error);
    return errorResponse("Internal server error", 500);
  }
}
