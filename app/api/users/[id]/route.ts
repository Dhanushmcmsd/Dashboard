import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { successResponse, errorResponse, validationError } from "@/lib/api-utils";
import { UpdateUserSchema } from "@/lib/validations";
import { sendDeactivationEmail, sendReactivationEmail } from "@/lib/email";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth(["ADMIN"]);
    if (auth.error) {
      return errorResponse(auth.error, auth.status);
    }

    if (params.id === auth.user.id) return errorResponse("Cannot modify your own account", 403);

    const body = await req.json();
    const result = UpdateUserSchema.safeParse(body);
    if (!result.success) {
      return validationError(result.error);
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!existingUser) {
      return errorResponse("User not found", 404);
    }

    const user = await prisma.user.update({
      where: { id: params.id },
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

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth(["ADMIN"]);
    if (auth.error) {
      return errorResponse(auth.error, auth.status);
    }

    if (params.id === auth.user.id) return errorResponse("Cannot deactivate your own account", 403);

    const user = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!user) {
      return errorResponse("User not found", 404);
    }

    // Soft delete
    await prisma.user.update({
      where: { id: params.id },
      data: { isActive: false },
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
