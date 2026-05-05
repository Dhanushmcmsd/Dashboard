import { withCompanyScope } from "@/lib/with-company-scope";
import { RouteBanner } from "@/components/dev/RouteBanner";

export default async function CompanyHomePage({
  params,
}: {
  params: { companySlug: string };
}) {
  let user;
  try {
    user = await withCompanyScope(params.companySlug);
  } catch (e) {
    if (e instanceof Response) return new Response(e.body, { status: e.status });
    throw e;
  }

  return (
    <div className="space-y-6">
      <RouteBanner
        route={`/${params.companySlug}`}
        role="company_admin | employee"
      />
      <div className="rounded-2xl border border-[#c8e6c0] bg-white p-8 text-center">
        <h1 className="text-2xl font-bold text-[#064734]">
          Welcome, {user.name}
        </h1>
        <p className="mt-2 text-[#4a7c5f]">
          Company dashboard home — select a portfolio from the sidebar.
        </p>
      </div>
    </div>
  );
}
