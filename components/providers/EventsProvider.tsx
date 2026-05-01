"use client";

import { useServerEvents } from "@/hooks/useServerEvents";

export default function EventsProvider({ children }: { children: React.ReactNode }) {
  useServerEvents();
  return <>{children}</>;
}
