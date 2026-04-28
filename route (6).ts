// FILE: app/api/alerts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import pusherServer from "@/lib/pusher";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const alerts = await prisma.alert.findMany({
      orderBy: { sentAt: "desc" },
      take: 50,
      select: {
        id: true,
        message: true,
        sentBy: true,
        sentAt: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(alerts);
  } catch (error) {
    console.error("Alerts GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "MANAGEMENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { message } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const alert = await prisma.alert.create({
      data: {
        message: message.trim(),
        sentBy: session.user.id,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    await pusherServer.trigger("alerts", "new-alert", {
      id: alert.id,
      message: alert.message,
      sentBy: alert.user.name,
      sentAt: alert.sentAt.toISOString(),
    });

    return NextResponse.json(alert, { status: 201 });
  } catch (error) {
    console.error("Alerts POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
