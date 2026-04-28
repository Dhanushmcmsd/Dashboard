// FILE: lib/pusher-server.ts

import PusherServer from "pusher";

if (
  !process.env.PUSHER_APP_ID ||
  !process.env.PUSHER_SECRET ||
  !process.env.NEXT_PUBLIC_PUSHER_KEY ||
  !process.env.NEXT_PUBLIC_PUSHER_CLUSTER
) {
  throw new Error("Missing required Pusher environment variables");
}

export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
  useTLS: true,
});

export const PUSHER_CHANNELS = {
  ALERTS: "private-alerts",
  UPLOADS: "private-uploads",
  DASHBOARD: "private-dashboard",
} as const;

export const PUSHER_EVENTS = {
  NEW_ALERT: "new-alert",
  UPLOAD_COMPLETE: "upload-complete",
  UPLOAD_FAILED: "upload-failed",
  DASHBOARD_UPDATED: "dashboard-updated",
} as const;

// In-memory event deduplication (process-level, 30s TTL)
const sentEvents = new Map<string, number>();

setInterval(() => {
  const now = Date.now();
  for (const [key, ts] of sentEvents.entries()) {
    if (now - ts > 30_000) sentEvents.delete(key);
  }
}, 15_000);

export async function triggerWithDedup(
  channel: string,
  event: string,
  data: Record<string, unknown>,
  dedupKey: string
): Promise<boolean> {
  const key = `${channel}:${event}:${dedupKey}`;
  if (sentEvents.has(key)) return false;
  sentEvents.set(key, Date.now());
  await pusherServer.trigger(channel, event, data);
  return true;
}
