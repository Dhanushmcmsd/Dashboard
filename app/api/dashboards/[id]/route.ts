import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardLayoutSchema } from "@/lib/types";
import { ZodError } from "zod";

type Params = { params: Promise<{ id: string }> };

// GET /api/dashboards/[id] — fetch single (owner or shared)
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const row = await prisma.dashboardLayout.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true } } },
    });

    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!row.isShared && row.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      id: row.id,
      name: row.name,
      isShared: row.isShared,
      layout: row.layout,
      widgets: row.widgets,
      widgetCount: Array.isArray(row.widgets) ? (row.widgets as unknown[]).length : 0,
      updatedAt: row.updatedAt.toISOString(),
      owner: row.user,
    });
  } catch (err) {
    console.error("[GET /api/dashboards/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/dashboards/[id] — update layout + widgets (owner only)
export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.dashboardLayout.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const data = DashboardLayoutSchema.parse(body);

    const updated = await prisma.dashboardLayout.update({
      where: { id },
      data: {
        name: data.name,
        layout: data.layout,
        widgets: data.widgets,
        isShared: data.isShared ?? existing.isShared,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: "Validation error", details: err.issues }, { status: 400 });
    }
    // Prisma not-found
    if ((err as { code?: string }).code === "P2025") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    console.error("[PUT /api/dashboards/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/dashboards/[id] — hard delete (owner or MANAGEMENT)
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.dashboardLayout.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.dashboardLayout.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    if ((err as { code?: string }).code === "P2025") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    console.error("[DELETE /api/dashboards/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
