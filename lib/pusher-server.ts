import PusherServer from "pusher";
import { PUSHER_CHANNELS, PUSHER_EVENTS } from "./constants";

let _pusherServer: PusherServer | null = null;

export function getPusherServer(): PusherServer {
  if (!_pusherServer) {
    _pusherServer = new PusherServer({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      useTLS: true,
    });
  }
  return _pusherServer;
}

// Keep backward-compatible named export as a Proxy so existing
// callers like `pusherServer.trigger(...)` still work without changes.
export const pusherServer = new Proxy({} as PusherServer, {
  get(_target, prop) {
    return (getPusherServer() as any)[prop];
  },
});

export { PUSHER_CHANNELS, PUSHER_EVENTS };
