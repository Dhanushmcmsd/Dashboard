import { NextResponse } from "next/server";
import { ZodError } from "zod";
import type { ApiResponse } from "@/types";
import { HTTP_STATUS } from "./constants";

export function successResponse<T>(data: T, status: number = HTTP_STATUS.OK) { return NextResponse.json({ success: true, data } satisfies ApiResponse<T>, { status }); }
export function errorResponse(error: string, status: number = HTTP_STATUS.INTERNAL_ERROR) { return NextResponse.json({ success: false, error } satisfies ApiResponse, { status }); }
export function validationError(err: ZodError) { const msg = err.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join("; "); return errorResponse(msg, HTTP_STATUS.BAD_REQUEST); }
