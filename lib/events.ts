export type AppEvent =
  | { type: "upload-complete"; branch: string; dateKey: string; uploadedBy: string }
  | { type: "dashboard-updated"; dateKey: string }
  | { type: "new-alert"; id: string; message: string; sentByName: string; sentAt: string };

export async function publishEvent(event: AppEvent) {
  try {
    const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = process.env;
    if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) return;

    // Publish via Upstash Streams (XADD) — REST API, no SDK needed
    await fetch(`${UPSTASH_REDIS_REST_URL}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(["XADD", "branchsync:stream", "*", "data", JSON.stringify(event)]),
    });
  } catch (error) {
    console.error("[publishEvent] Failed:", error);
  }
}
