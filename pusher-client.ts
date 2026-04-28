// FILE: lib/pusher-client.ts

import PusherClient from "pusher-js";

let pusherInstance: PusherClient | null = null;

export function getPusherClient(): PusherClient {
  if (pusherInstance) return pusherInstance;

  if (
    !process.env.NEXT_PUBLIC_PUSHER_KEY ||
    !process.env.NEXT_PUBLIC_PUSHER_CLUSTER
  ) {
    throw new Error("Missing Pusher client environment variables");
  }

  pusherInstance = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    authEndpoint: "/api/pusher/auth",
    enabledTransports: ["ws", "wss"],
    // Reconnection config
    activityTimeout: 30_000,
    pongTimeout: 15_000,
  });

  pusherInstance.connection.bind("error", (err: { type: string; error?: Error }) => {
    console.error("[Pusher] Connection error:", err);
  });

  pusherInstance.connection.bind("disconnected", () => {
    console.warn("[Pusher] Disconnected — will attempt reconnect automatically");
  });

  return pusherInstance;
}

export function disconnectPusher() {
  if (pusherInstance) {
    pusherInstance.disconnect();
    pusherInstance = null;
  }
}
