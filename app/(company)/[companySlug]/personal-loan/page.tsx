import { withCompanyScope } from "@/lib/with-company-scope";
import { RouteBanner } from "@/components/dev/RouteBanner";
import { ComingSoon } from "@/components/dev/ComingSoon";

export default async function PersonalLoanPage({
  params,
}: {
  params: { companySlug: string };
}) {
  try {
    await withCompanyScope(params.companySlug);
  } catch (e) {
    if (e instanceof Response) return new Response(e.body, { status: e.status });
    throw e;
  }

  return (
    <div className="space-y-6">
      <RouteBanner
        route={`/${params.companySlug}/personal-loan`}
        role="company_admin | super_admin"
      />
      <ComingSoon title="Personal Loan" />
    </div>
  );
}
