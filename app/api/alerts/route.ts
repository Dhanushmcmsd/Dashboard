import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { successResponse, errorResponse, validationError } from "@/lib/api-utils";
import { AlertCreateSchema } from "@/lib/validations";
import { publishEvent } from "@/lib/events";

export async function GET(req: Request) {
  try {
    const auth = await requireAuth();
    if (auth.error) {
      return errorResponse(auth.error, auth.status);
    }

    const alerts = await prisma.alert.findMany({
      orderBy: { sentAt: "desc" },
      take: 50,
      include: { user: true },
    });

    const formatted = alerts.map((a) => ({
      id: a.id,
      message: a.message,
      sentBy: a.sentBy,
      sentByName: a.user.name,
      sentAt: a.sentAt.toISOString(),
    }));

    return successResponse(formatted);
  } catch (error) {
    console.error("Fetch alerts error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(["MANAGEMENT"]);
    if (auth.error) return errorResponse(auth.error, auth.status);

    const user = auth.user!;

    const body = await req.json();
    const result = AlertCreateSchema.safeParse(body);
    if (!result.success) {
      return validationError(result.error);
    }

    const alert = await prisma.alert.create({
      data: {
        message: result.data.message,
        sentBy: user.id,
      },
      include: { user: true },
    });

    const formatted = {
      id: alert.id,
      message: alert.message,
      sentBy: alert.sentBy,
      sentByName: alert.user.name,
      sentAt: alert.sentAt.toISOString(),
    };

    await publishEvent({
      type: "new-alert",
      id: alert.id,
      message: alert.message,
      sentByName: alert.user.name,
      sentAt: alert.sentAt.toISOString(),
    });

    return successResponse(formatted, 201);
  } catch (error) {
    console.error("Create alert error:", error);
    return errorResponse("Internal server error", 500);
  }
}
