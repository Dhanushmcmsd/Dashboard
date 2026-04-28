import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, validationError } from "@/lib/api-utils";
import { SignupSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const parsed = SignupSchema.safeParse(await req.json());
    if (!parsed.success) return validationError(parsed.error);
    const { name, email, password } = parsed.data;
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return errorResponse("Email already registered", 400);
    const hashed = await bcrypt.hash(password, 12);
    await prisma.user.create({ data: { name, email, password: hashed, role: "EMPLOYEE", branches: [], isActive: false } });
    return successResponse({ registered: true, message: "Account pending admin activation" }, 201);
  } catch { return errorResponse("Registration failed"); }
}
