import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ exists: false });

  const user = await prisma.user.findUnique({
    where: { email },
    select: { isActive: true, passwordSet: true },
  });

  return NextResponse.json({
    exists: !!user,
    isActive: user?.isActive ?? false,
    passwordSet: user?.passwordSet ?? false,
  });
}
