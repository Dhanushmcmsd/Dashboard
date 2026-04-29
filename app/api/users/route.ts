import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, validationError } from "@/lib/api-utils";
import { CreateUserSchema } from "@/lib/validations";
import { HTTP_STATUS } from "@/lib/constants";

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role: string }).role !== "ADMIN") return errorResponse("Forbidden", HTTP_STATUS.FORBIDDEN);
    const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, branches: true, isActive: true, createdAt: true, passwordSet: true }, orderBy: { createdAt: "desc" } });
    return successResponse(users);
  } catch { return errorResponse("Failed to list users"); }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role: string }).role !== "ADMIN") return errorResponse("Forbidden", HTTP_STATUS.FORBIDDEN);
    const parsed = CreateUserSchema.safeParse(await req.json());
    if (!parsed.success) return validationError(parsed.error);
    const { name, email, password, role, branches, isActive } = parsed.data;
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return errorResponse("Email already registered", HTTP_STATUS.BAD_REQUEST);
    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({ data: { name, email, password: hashed, role, branches, isActive, passwordSet: true }, select: { id: true, name: true, email: true, role: true, branches: true, isActive: true, createdAt: true, passwordSet: true } });
    return successResponse(user, HTTP_STATUS.CREATED);
  } catch { return errorResponse("Failed to create user"); }
}
