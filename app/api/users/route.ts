import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { successResponse, errorResponse, validationError } from "@/lib/api-utils";
import { CreateUserSchema } from "@/lib/validations";
import bcrypt from "bcryptjs";

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(["ADMIN"]);
    if (auth.error) {
      return errorResponse(auth.error, auth.status);
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        branches: true,
        isActive: true,
        passwordSet: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(users);
  } catch (error) {
    console.error("Fetch users error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(["ADMIN"]);
    if (auth.error) {
      return errorResponse(auth.error, auth.status);
    }

    const body = await req.json();
    const result = CreateUserSchema.safeParse(body);
    if (!result.success) {
      return validationError(result.error);
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: result.data.email },
    });

    if (existingUser) {
      return errorResponse("User with this email already exists", 400);
    }

    // Default password for manual creation, but usually they'll get a setup link
    const hashedPassword = await bcrypt.hash(Math.random().toString(36).slice(-8), 10);

    const user = await prisma.user.create({
      data: {
        name: result.data.name,
        email: result.data.email,
        password: hashedPassword,
        role: result.data.role,
        branches: result.data.branches,
        isActive: result.data.isActive,
        passwordSet: false, // Force them to set password
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        branches: true,
        isActive: true,
        passwordSet: true,
        createdAt: true,
      },
    });

    return successResponse(user, 201);
  } catch (error) {
    console.error("Create user error:", error);
    return errorResponse("Internal server error", 500);
  }
}
