import { Redis } from "@upstash/redis";

export type AppEvent =
  | { type: "upload-complete"; branch: string; dateKey: string; uploadedBy: string }
  | { type: "dashboard-updated"; dateKey: string }
  | { type: "new-alert"; id: string; message: string; sentByName: string; sentAt: string };

// Upstash Redis client (REST-based, works in both Edge and Node runtimes)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function publishEvent(event: AppEvent) {
  try {
    await redis.publish("branchsync:events", JSON.stringify(event));
  } catch (error) {
    // Never let event publishing crash an API route
    console.error("[publishEvent] Failed to publish event:", error);
  }
}
