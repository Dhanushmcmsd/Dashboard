// Upstash-based rate limiter — works correctly on Vercel serverless (no shared memory required)
// Uses a sliding window via Upstash REST API (INCR + EXPIRE)

export default function rateLimit(options?: { interval?: number }) {
  const intervalMs = options?.interval ?? 60_000;
  const intervalSec = Math.ceil(intervalMs / 1000);

  return {
    check: async (limit: number, token: string): Promise<void> => {
      const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = process.env;

      // Fallback to always-allow if env vars not set (local dev without Redis)
      if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) return;

      const key = `rate_limit:${token}`;

      const pipeline = [
        ["INCR", key],
        ["EXPIRE", key, intervalSec, "NX"],
      ];

      const res = await fetch(UPSTASH_REDIS_REST_URL + "/pipeline", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(pipeline),
      });

      const json = await res.json();
      const count: number = json?.[0]?.result ?? 0;

      if (count > limit) {
        throw new Error("Rate limit exceeded");
      }
    },
  };
}
