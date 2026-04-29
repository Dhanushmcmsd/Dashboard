import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { successResponse, errorResponse } from "@/lib/api-utils";
import * as jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, password } = body;

    if (!token || !password) {
      return errorResponse("Token and password are required");
    }

    if (password.length < 6) {
      return errorResponse("Password must be at least 6 characters");
    }

    const JWT_SECRET = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      return errorResponse("Server configuration error", 500);
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return errorResponse("Invalid or expired token", 400);
    }

    const userId = decoded.userId;
    if (!userId) {
      return errorResponse("Invalid token payload", 400);
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return errorResponse("User not found", 404);
    }

    if (!user.isActive) {
      return errorResponse("Account is not active", 403);
    }

    if (user.passwordSet) {
      return errorResponse("Password is already set. Please login.", 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        passwordSet: true,
      },
    });

    return successResponse({ success: true, message: "Password set successfully" });
  } catch (error) {
    console.error("Set password error:", error);
    return errorResponse("Internal server error", 500);
  }
}
