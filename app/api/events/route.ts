import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = process.env;
  if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
    return new Response("SSE not configured", { status: 503 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial ping
      controller.enqueue(encoder.encode("event: connected\ndata: {}\n\n"));

      // Poll Upstash for new messages every 2 seconds via REST
      // (Upstash doesn't support persistent TCP subscribe over HTTP)
      let lastId = "$";

      const poll = async () => {
        try {
          const res = await fetch(
            `${UPSTASH_REDIS_REST_URL}/xread/COUNT/10/BLOCK/2000/STREAMS/branchsync:stream/${lastId}`,
            { headers: { Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}` } }
          );
          const json = await res.json();
          if (json.result) {
            for (const [, entries] of json.result) {
              for (const [id, fields] of entries) {
                lastId = id;
                const dataIdx = fields.indexOf("data");
                if (dataIdx !== -1) {
                  controller.enqueue(encoder.encode(`data: ${fields[dataIdx + 1]}\n\n`));
                }
              }
            }
          }
        } catch {
          // ignore poll errors
        }

        if (!req.signal.aborted) {
          setTimeout(poll, 100);
        } else {
          controller.close();
        }
      };

      poll();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
