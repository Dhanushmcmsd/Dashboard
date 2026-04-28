import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, validationError } from "@/lib/api-utils";
import { AlertCreateSchema } from "@/lib/validations";
import { pusherServer } from "@/lib/pusher-server";
import { PUSHER_CHANNELS, PUSHER_EVENTS, HTTP_STATUS } from "@/lib/constants";
import type { SessionUser } from "@/types";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return errorResponse("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    const alerts = await prisma.alert.findMany({ orderBy: { sentAt: "desc" }, take: 50, select: { id: true, message: true, sentAt: true, user: { select: { id: true, name: true } } } });
    return successResponse(alerts.map((a) => ({ id: a.id, message: a.message, sentBy: a.user.id, sentByName: a.user.name, sentAt: a.sentAt.toISOString() })));
  } catch { return errorResponse("Failed to fetch alerts"); }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as SessionUser).role !== "MANAGEMENT") return errorResponse("Forbidden", HTTP_STATUS.FORBIDDEN);
    const user = session.user as SessionUser;
    const parsed = AlertCreateSchema.safeParse(await req.json());
    if (!parsed.success) return validationError(parsed.error);
    const dbUser = await prisma.user.findUnique({ where: { email: user.email }, select: { id: true } });
    if (!dbUser) return errorResponse("User not found", 401);
    const alert = await prisma.alert.create({ data: { message: parsed.data.message, sentBy: dbUser.id }, select: { id: true, message: true, sentAt: true, user: { select: { id: true, name: true } } } });
    const payload = { id: alert.id, message: alert.message, sentBy: alert.user.id, sentByName: alert.user.name, sentAt: alert.sentAt.toISOString() };
    await pusherServer.trigger(PUSHER_CHANNELS.ALERTS, PUSHER_EVENTS.NEW_ALERT, payload);
    return successResponse(payload, HTTP_STATUS.CREATED);
  } catch { return errorResponse("Failed to send alert"); }
}
