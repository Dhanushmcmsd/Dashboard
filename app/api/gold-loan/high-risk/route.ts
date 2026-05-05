import { getHighRiskAccounts } from "@/lib/gold-loan/data-access";
import { errorResponse, successResponse } from "@/lib/api-utils";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const companySlug = searchParams.get("companySlug");
    const asOnDateInput = searchParams.get("asOnDate");
    const ltvThresholdInput = searchParams.get("ltvThreshold");

    if (!companySlug || !asOnDateInput) {
      return errorResponse("companySlug and asOnDate are required.", 400);
    }

    const asOnDate = new Date(asOnDateInput);
    if (Number.isNaN(asOnDate.getTime())) {
      return errorResponse("Invalid asOnDate.", 400);
    }

    const ltvThreshold = ltvThresholdInput ? Number(ltvThresholdInput) : 75;
    const data = await getHighRiskAccounts(companySlug, asOnDate, ltvThreshold);
    return successResponse(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch high risk accounts.";
    return errorResponse(message, 500);
  }
}
