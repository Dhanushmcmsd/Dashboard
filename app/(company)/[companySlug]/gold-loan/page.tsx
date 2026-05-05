import { withCompanyScope } from "@/lib/with-company-scope";
import { RouteBanner } from "@/components/dev/RouteBanner";

export default async function GoldLoanPage({
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
        route={`/${params.companySlug}/gold-loan`}
        role="company_admin | super_admin"
      />
      <div className="rounded-2xl border border-[#c8e6c0] bg-white p-8">
        <h1 className="text-2xl font-bold text-[#064734]">Gold Loan Dashboard</h1>
        <p className="mt-2 text-[#4a7c5f]">
          Shell — real KPI widgets will be connected in a future batch.
        </p>
      </div>
    </div>
  );
}
