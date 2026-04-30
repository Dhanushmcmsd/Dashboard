import PusherClient from "pusher-js";

// No-op stub so all pusher.subscribe(...).bind(...) calls work safely
// when NEXT_PUBLIC_PUSHER_APP_KEY is not configured.
const noopChannel = {
  bind: () => noopChannel,
  unbind: () => noopChannel,
  unbind_all: () => noopChannel,
};

const noopPusher = {
  subscribe: (_channel: string) => noopChannel,
  unsubscribe: (_channel: string) => {},
  disconnect: () => {},
  bind: () => {},
  unbind: () => {},
} as unknown as PusherClient;

let pusherClientInstance: PusherClient | null = null;

export const getPusherClient = (): PusherClient => {
  if (typeof window === "undefined") return noopPusher;

  const appKey = process.env.NEXT_PUBLIC_PUSHER_APP_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!appKey || !cluster) {
    console.warn("Pusher env vars not set — realtime features disabled.");
    return noopPusher;
  }

  if (!pusherClientInstance) {
    pusherClientInstance = new PusherClient(appKey, {
      cluster,
      authEndpoint: "/api/pusher/auth",
    });
  }
  return pusherClientInstance;
};
