import PusherClient from "pusher-js";

let pusherClientInstance: PusherClient | null = null;

export const getPusherClient = (): PusherClient | null => {
  if (typeof window === "undefined") return null;
  
  const appKey = process.env.NEXT_PUBLIC_PUSHER_APP_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!appKey || !cluster) {
    console.warn("Pusher env vars not set — realtime features disabled.");
    return null;
  }

  if (!pusherClientInstance) {
    pusherClientInstance = new PusherClient(appKey, {
      cluster,
      authEndpoint: "/api/pusher/auth",
    });
  }
  return pusherClientInstance;
};
