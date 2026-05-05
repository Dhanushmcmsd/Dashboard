import { RouteBanner } from "@/components/dev/RouteBanner";

export default function AdminCompaniesPage() {
  return (
    <div className="space-y-6">
      <RouteBanner route="/admin/companies" role="super_admin" />
      <div className="rounded-2xl border border-[#c8e6c0] bg-white p-8">
        <h1 className="text-2xl font-bold text-[#064734]">Companies</h1>
        <p className="mt-2 text-[#4a7c5f]">
          Shell — company list and management UI will be built in a future batch.
        </p>
      </div>
    </div>
  );
}
