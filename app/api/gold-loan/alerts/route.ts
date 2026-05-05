import { getAlerts } from "@/lib/gold-loan/data-access";
import { errorResponse, successResponse } from "@/lib/api-utils";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const companySlug = searchParams.get("companySlug");
    if (!companySlug) {
      return errorResponse("companySlug is required.", 400);
    }

    const data = await getAlerts(companySlug);
    return successResponse(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch alerts.";
    return errorResponse(message, 500);
  }
}
