// FILE: app/api/dashboard/branch/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "MANAGEMENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const branch = searchParams.get("branch");

    if (!branch) {
      return NextResponse.json({ error: "Branch param required" }, { status: 400 });
    }

    const upload = await prisma.upload.findFirst({
      where: { branch },
      orderBy: { uploadedAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!upload) {
      return NextResponse.json({ data: null });
    }

    return NextResponse.json({ data: upload });
  } catch (error) {
    console.error("Branch dashboard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
