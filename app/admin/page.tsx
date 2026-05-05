import { RouteBanner } from "@/components/dev/RouteBanner";

export default function AdminHomePage() {
  return (
    <div className="space-y-6">
      <RouteBanner route="/admin" role="super_admin" />
      <div className="rounded-2xl border border-[#c8e6c0] bg-white p-8">
        <h1 className="text-2xl font-bold text-[#064734]">Admin Portal</h1>
        <p className="mt-2 text-[#4a7c5f]">
          Super-admin home — manage users and companies from the sidebar.
        </p>
      </div>
    </div>
  );
}
