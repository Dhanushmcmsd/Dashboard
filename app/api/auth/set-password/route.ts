import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { jwtVerify } from "jose";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-utils";

const Schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  try {
    const parsed = Schema.safeParse(await req.json());
    if (!parsed.success) return errorResponse("Invalid request", 400);
    if (!process.env.NEXTAUTH_SECRET) return errorResponse("NEXTAUTH_SECRET is not configured", 500);

    const { token, password } = parsed.data;
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);

    let userId: string;
    try {
      const { payload } = await jwtVerify(token, secret);
      if (typeof payload.userId !== "string") return errorResponse("This link is invalid.", 401);
      userId = payload.userId;
    } catch {
      return errorResponse("This link has expired or is invalid. Ask your admin for a new one.", 401);
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return errorResponse("User not found", 404);
    if (!user.isActive) return errorResponse("Your account is not active yet.", 403);
    if (user.passwordSet) return errorResponse("Password has already been set. Use the login page.", 409);

    const hashed = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed, passwordSet: true },
    });

    return successResponse({ message: "Password set successfully. You can now log in." });
  } catch {
    return errorResponse("Failed to set password");
  }
}
