import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { pusherServer } from "@/lib/pusher-server";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const params = new URLSearchParams(await req.text());
  const authResponse = pusherServer.authorizeChannel(params.get("socket_id") || "", params.get("channel_name") || "", { user_id: (session.user as { id: string }).id });
  return NextResponse.json(authResponse);
}
