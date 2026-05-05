import { getDashboardData } from "@/lib/gold-loan/data-access";
import { errorResponse, successResponse } from "@/lib/api-utils";
import { PeriodType } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const companySlug = searchParams.get("companySlug");
    const periodType = (searchParams.get("periodType") as PeriodType | null) ?? PeriodType.MTD;
    const asOnDateInput = searchParams.get("asOnDate");

    if (!companySlug || !asOnDateInput) {
      return errorResponse("companySlug and asOnDate are required.", 400);
    }

    const asOnDate = new Date(asOnDateInput);
    if (Number.isNaN(asOnDate.getTime())) {
      return errorResponse("Invalid asOnDate.", 400);
    }

    const data = await getDashboardData(companySlug, periodType, asOnDate);
    return successResponse(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch dashboard data.";
    return errorResponse(message, 500);
  }
}
