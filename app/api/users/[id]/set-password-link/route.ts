import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { SignJWT } from "jose";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-utils";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
      return errorResponse("Forbidden", 403);
    }

    if (!process.env.NEXTAUTH_SECRET) return errorResponse("NEXTAUTH_SECRET is not configured", 500);

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, isActive: true, passwordSet: true },
    });
    if (!user) return errorResponse("User not found", 404);
    if (!user.isActive) return errorResponse("User is not active yet", 400);
    if (user.passwordSet) return errorResponse("User has already set their password", 400);

    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
    const token = await new SignJWT({ userId: user.id })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .setIssuedAt()
      .sign(secret);

    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    return successResponse({ link: `${baseUrl}/set-password?token=${token}` });
  } catch {
    return errorResponse("Failed to generate link");
  }
}
