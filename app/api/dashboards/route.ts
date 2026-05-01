import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardLayoutSchema } from "@/lib/types";
import { ZodError } from "zod";

// GET /api/dashboards — list caller's own + all shared dashboards
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rows = await prisma.dashboardLayout.findMany({
      where: {
        OR: [
          { userId: session.user.id },
          { isShared: true },
        ],
      },
      orderBy: { updatedAt: "desc" },
      include: { user: { select: { id: true, name: true } } },
    });

    const result = rows.map((r) => ({
      id: r.id,
      name: r.name,
      isShared: r.isShared,
      widgetCount: Array.isArray(r.widgets) ? (r.widgets as unknown[]).length : 0,
      updatedAt: r.updatedAt.toISOString(),
      owner: r.user,
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("[GET /api/dashboards]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/dashboards — create a new dashboard (MANAGEMENT only)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "MANAGEMENT" && session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = DashboardLayoutSchema.parse(body);

    const created = await prisma.dashboardLayout.create({
      data: {
        userId: session.user.id,
        name: data.name,
        layout: data.layout,
        widgets: data.widgets,
        isShared: data.isShared ?? false,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: "Validation error", details: err.errors }, { status: 400 });
    }
    console.error("[POST /api/dashboards]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
