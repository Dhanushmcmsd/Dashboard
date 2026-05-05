// ⛔ THIS ENDPOINT HAS BEEN DISABLED FOR SECURITY REASONS.
// Seeding is a one-time CLI operation — never via HTTP.
// Use: npx prisma db seed
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: "This endpoint is disabled. Use the CLI seed script: npx prisma db seed" },
    { status: 410 }
  );
}

export async function POST() {
  return NextResponse.json(
    { error: "This endpoint is disabled. Use the CLI seed script: npx prisma db seed" },
    { status: 410 }
  );
}
