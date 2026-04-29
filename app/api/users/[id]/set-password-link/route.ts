import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api-utils";
import * as jwt from "jsonwebtoken";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth(["ADMIN"]);
    if (auth.error) {
      return errorResponse(auth.error, auth.status);
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!user) {
      return errorResponse("User not found", 404);
    }

    if (!user.isActive) {
      return errorResponse("Cannot generate link for pending user. Approve first.", 400);
    }

    if (user.passwordSet) {
      return errorResponse("User already has a password set", 400);
    }

    const JWT_SECRET = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      return errorResponse("Server configuration error", 500);
    }

    const token = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Get origin from request headers or environment
    const url = new URL(req.url);
    const baseUrl = process.env.NEXTAUTH_URL || `${url.protocol}//${url.host}`;
    
    const link = `${baseUrl}/set-password?token=${token}`;

    return successResponse({ link });
  } catch (error) {
    console.error("Generate password link error:", error);
    return errorResponse("Internal server error", 500);
  }
}
