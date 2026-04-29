import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, validationError } from "@/lib/api-utils";
import { SignupSchema } from "@/lib/validations";
import bcrypt from "bcryptjs";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = SignupSchema.safeParse(body);
    if (!result.success) {
      return validationError(result.error);
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: result.data.email },
    });

    if (existingUser) {
      return errorResponse("User with this email already exists", 400);
    }

    // Hash a random password since they will set it via link later
    const randomPassword = Math.random().toString(36).slice(-10);
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    const user = await prisma.user.create({
      data: {
        name: result.data.name,
        email: result.data.email,
        password: hashedPassword,
        role: "EMPLOYEE",
        isActive: false,
        passwordSet: false,
        branches: [],
      },
    });

    await sendWelcomeEmail(user.email, user.name);

    return successResponse({ registered: true }, 201);
  } catch (error) {
    console.error("Signup error:", error);
    return errorResponse("Internal server error", 500);
  }
}
