import { NextResponse } from "next/server";
import { z } from "zod";

export function successResponse<T>(data?: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function validationError(error: z.ZodError<any>) {
  const message = error.issues.map((e: any) => `${e.path.join(".")}: ${e.message}`).join(", ");
  return errorResponse(message, 400);
}
