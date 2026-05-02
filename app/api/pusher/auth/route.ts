// Pusher is not used in this project — real-time events go via Upstash Redis streams.
// This file is kept as a stub to prevent module-not-found build errors.
import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ error: 'Pusher is not configured' }, { status: 501 });
}
