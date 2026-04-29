import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { HTTP_STATUS } from "@/lib/constants";

export async function GET(req: Request) {
  try {
    await new Promise((resolve) => setTimeout(resolve, 300));
    
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return errorResponse("Email is required");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return errorResponse("Invalid email", HTTP_STATUS.BAD_REQUEST);

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        isActive: true,
        passwordSet: true,
      },
    });

    if (!user) {
      return successResponse({ exists: false, isActive: false, passwordSet: false });
    }

    return successResponse({
      exists: true,
      isActive: user.isActive,
      passwordSet: user.passwordSet,
    });
  } catch (error) {
    console.error("Check email error:", error);
    return errorResponse("Internal server error", 500);
  }
}
