import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";
import EventsProvider from "@/components/providers/EventsProvider";
import Image from "next/image";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f7fff0]">

      {/* ── Sidebar ── */}
      <aside className="w-full md:w-64 bg-white border-r border-[#c8e6c0] shrink-0 flex flex-col shadow-[2px_0_12px_rgba(6,71,52,0.06)]">

        {/* Logo area */}
        <div className="p-6 border-b border-[#c8e6c0]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#064734] rounded-xl flex items-center justify-center shrink-0">
              <Image
                src="/logo.svg"
                alt="Supra Pacific"
                width={22}
                height={22}
                className="invert"
                style={{ objectFit: "contain" }}
              />
            </div>
            <div>
              <p className="text-sm font-bold text-[#064734] leading-tight">Supra Pacific</p>
              <p className="text-[10px] text-[#4a7c5f] uppercase tracking-widest">MIS</p>
            </div>
          </div>
          {/* Admin badge */}
          <div className="mt-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#f0fce8] border border-[#c8e6c0] rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#064734]" />
              <span className="text-[10px] font-semibold text-[#064734] uppercase tracking-wider">Admin Portal</span>
            </span>
          </div>
        </div>

        {/* Nav */}
        <div className="flex-1 px-3 py-3">
          <AdminNav />
        </div>

        {/* User info footer */}
        <div className="p-4 border-t border-[#c8e6c0]">
          <div className="bg-[#f0fce8] border border-[#c8e6c0] rounded-2xl px-4 py-3">
            <p className="text-sm font-semibold text-[#064734] truncate">{session.user.name}</p>
            <p className="text-xs text-[#4a7c5f] truncate mt-0.5">{session.user.email}</p>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>

      <EventsProvider>{null}</EventsProvider>
    </div>
  );
}
