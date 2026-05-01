import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  let subscriber: ReturnType<typeof createClient> | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        subscriber = createClient({ url: process.env.KV_URL });
        await subscriber.connect();

        // Send initial ping so the browser confirms the connection is open
        controller.enqueue("event: connected\ndata: {}\n\n");

        await subscriber.subscribe("branchsync:events", (message) => {
          try {
            controller.enqueue(`data: ${message}\n\n`);
          } catch {
            // Controller may already be closed
          }
        });

        req.signal.addEventListener("abort", async () => {
          try {
            if (subscriber) {
              await subscriber.unsubscribe();
              await subscriber.disconnect();
            }
            controller.close();
          } catch {
            // ignore cleanup errors
          }
        });
      } catch (error) {
        console.error("[SSE] Connection error:", error);
        controller.close();
      }
    },
    async cancel() {
      try {
        if (subscriber) {
          await subscriber.unsubscribe();
          await subscriber.disconnect();
        }
      } catch {
        // ignore
      }
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
