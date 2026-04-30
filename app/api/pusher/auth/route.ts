import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { pusherServer } from '@/lib/pusher-server';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.text();
  const params = new URLSearchParams(body);
  const socketId = params.get('socket_id');
  const channelName = params.get('channel_name');

  if (!socketId || !channelName) {
    return NextResponse.json({ error: 'Missing socket_id or channel_name' }, { status: 400 });
  }

  // Only allow private- and presence- channels
  if (!channelName.startsWith('private-') && !channelName.startsWith('presence-')) {
    return NextResponse.json({ error: 'Only private/presence channels allowed' }, { status: 403 });
  }

  // For presence channels, attach user data
  const presenceData =
    channelName.startsWith('presence-')
      ? {
          user_id: session.user.email,
          user_info: { name: session.user.name, email: session.user.email },
        }
      : undefined;

  const authResponse = presenceData
    ? pusherServer.authorizeChannel(socketId, channelName, presenceData)
    : pusherServer.authorizeChannel(socketId, channelName);

  return NextResponse.json(authResponse);
}
