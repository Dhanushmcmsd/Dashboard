import { withCompanyScope } from "@/lib/with-company-scope";
import { RouteBanner } from "@/components/dev/RouteBanner";
import { ComingSoon } from "@/components/dev/ComingSoon";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";

export default async function PersonalLoanPage({
  params,
}: {
  params: { companySlug: string };
}) {
  try {
    await withCompanyScope(params.companySlug);
  } catch (e) {
    if (e instanceof Response) {
      if (e.status === 401 || e.status === 403) {
        redirect("/login");
      }
      notFound();
    }
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
