import { useQuery } from "@tanstack/react-query";
import type { GoldLoanDashboardData } from "@/types";
import { apiFetch } from "@/lib/query-client";
import type { PeriodType } from "@prisma/client";

export function useGoldLoanDashboard(
  companySlug: string,
  periodType: PeriodType,
  asOnDate: string
) {
  return useQuery({
    queryKey: ["gold-loan-dashboard", companySlug, periodType, asOnDate],
    queryFn: () =>
      apiFetch<GoldLoanDashboardData>(
        `/api/gold-loan/dashboard?companySlug=${encodeURIComponent(
          companySlug
        )}&periodType=${periodType}&asOnDate=${encodeURIComponent(asOnDate)}`
      ),
    enabled: Boolean(companySlug && asOnDate),
  });
}
