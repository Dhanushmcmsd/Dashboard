import { LRUCache } from "lru-cache";
import { NextRequest } from "next/server";

export function rateLimit(options?: {
  interval?: number;
  uniqueTokenPerInterval?: number;
}) {
  const tokenCache = new LRUCache({
    max: options?.uniqueTokenPerInterval || 500,
    ttl: options?.interval || 60000,
  });

  return {
    check: (req: NextRequest, limit: number, token: string) =>
      new Promise<void>((resolve, reject) => {
        const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
        const tokenKey = token + ip;
        const tokenCount = (tokenCache.get(tokenKey) as number[]) || [0];
        if (tokenCount[0] === 0) {
          tokenCache.set(tokenKey, tokenCount);
        }
        tokenCount[0] += 1;

        const currentUsage = tokenCount[0];
        const isRateLimited = currentUsage > limit;
        if (isRateLimited) {
          return reject();
        }
        return resolve();
      }),
  };
}
