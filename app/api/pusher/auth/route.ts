import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { pusherServer } from "@/lib/pusher-server";

export async function POST(req: Request) {
  try {
    const auth = await requireAuth();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const data = await req.text();
    const [socketId, channelName] = data
      .split("&")
      .map((str) => str.split("=")[1]);

    if (!socketId || !channelName) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const authResponse = pusherServer.authorizeChannel(socketId, channelName, {
      user_id: auth.user!.id,
    });

    return NextResponse.json(authResponse);
  } catch (error) {
    console.error("Pusher auth error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
