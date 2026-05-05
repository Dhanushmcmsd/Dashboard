import { withCompanyScope } from "@/lib/with-company-scope";
import { RouteBanner } from "@/components/dev/RouteBanner";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";

export default async function UploadPage({
  params,
}: {
  params: Promise<{ companySlug: string }>;
}) {
  const { companySlug } = await params;
  let user;
  try {
    user = await withCompanyScope(companySlug);
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
        route={`/${companySlug}/upload`}
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
