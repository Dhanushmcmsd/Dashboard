import { getDisbursementTrend } from "@/lib/gold-loan/data-access";
import { errorResponse, successResponse } from "@/lib/api-utils";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const companySlug = searchParams.get("companySlug");
    const daysInput = searchParams.get("days");

    if (!companySlug) {
      return errorResponse("companySlug is required.", 400);
    }

    const days = daysInput ? Number(daysInput) : 30;
    const data = await getDisbursementTrend(companySlug, days);
    return successResponse(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch disbursement trend.";
    return errorResponse(message, 500);
  }
}
