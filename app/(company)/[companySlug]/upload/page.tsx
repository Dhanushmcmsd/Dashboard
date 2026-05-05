import { withCompanyScope } from "@/lib/with-company-scope";
import { RouteBanner } from "@/components/dev/RouteBanner";

export default async function UploadPage({
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
        route={`/${params.companySlug}/upload`}
        role="employee | company_admin | super_admin"
      />
      <div className="rounded-2xl border border-[#c8e6c0] bg-white p-8">
        <h1 className="text-2xl font-bold text-[#064734]">Upload Data</h1>
        <p className="mt-2 text-[#4a7c5f]">
          Upload shell — file picker and parser will be wired in a future batch.
        </p>
      </div>
    </div>
  );
}
