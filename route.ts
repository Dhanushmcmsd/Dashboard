// FILE: app/api/upload/history/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const uploads = await prisma.upload.findMany({
      where: { uploadedBy: session.user.id },
      select: {
        id: true,
        branch: true,
        fileType: true,
        fileName: true,
        uploadedBy: true,
        uploadedAt: true,
        dateKey: true,
        monthKey: true,
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { uploadedAt: "desc" },
      take: 50,
    });

    return NextResponse.json(uploads);
  } catch (error) {
    console.error("Upload history error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
