import { kv } from "@vercel/kv";

export type AppEvent =
  | { type: "upload-complete"; branch: string; dateKey: string; uploadedBy: string }
  | { type: "dashboard-updated"; dateKey: string }
  | { type: "new-alert"; id: string; message: string; sentByName: string; sentAt: string };

export async function publishEvent(event: AppEvent) {
  try {
    await kv.publish("branchsync:events", JSON.stringify(event));
  } catch (error) {
    // Never let event publishing crash an API route
    console.error("[publishEvent] Failed to publish event:", error);
  }
}
