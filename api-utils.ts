// FILE: lib/api-utils.ts

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import type { ApiResponse } from "@/types";
import { HTTP_STATUS } from "./constants";

export function successResponse<T>(data: T, status = HTTP_STATUS.OK): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(
  error: string,
  status = HTTP_STATUS.INTERNAL_ERROR
): NextResponse<ApiResponse<never>> {
  return NextResponse.json({ success: false, error }, { status });
}

export function validationErrorResponse(err: ZodError): NextResponse<ApiResponse<never>> {
  const message = err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
  return errorResponse(message, HTTP_STATUS.BAD_REQUEST);
}

export function parseSearchParams<T>(
  searchParams: URLSearchParams,
  schema: { parse: (input: unknown) => T }
): { success: true; data: T } | { success: false; error: ZodError } {
  try {
    const raw: Record<string, string> = {};
    searchParams.forEach((v, k) => (raw[k] = v));
    return { success: true, data: schema.parse(raw) };
  } catch (err) {
    if (err instanceof ZodError) return { success: false, error: err };
    throw err;
  }
}

/** Strips sensitive fields from user objects before sending over the wire */
export function sanitizeUser(user: {
  id: string;
  email: string;
  name: string;
  role: string;
  branchId: string | null;
  password?: string;
  [key: string]: unknown;
}) {
  const { password: _pw, ...safe } = user;
  return safe;
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}
