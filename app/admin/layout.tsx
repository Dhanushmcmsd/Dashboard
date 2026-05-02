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
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0D1117]">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-surface border-r border-border shrink-0 flex flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3 mb-1">
            <img
              src="/supra-pacific-rights-issue-logo.png"
              alt="Supra Pacific"
              width={36}
              height={36}
              className="object-contain"
            />
            <div>
              <p className="text-sm font-bold text-white leading-tight">Supra Pacific</p>
              <p className="text-[10px] text-text-muted uppercase tracking-widest">Management Information System</p>
            </div>
          </div>
          <p className="text-[10px] text-text-muted uppercase tracking-wider mt-3 pl-0.5 border-l-2 border-accent pl-2">
            Admin Portal
          </p>
        </div>

        <div className="flex-1 px-4 py-2">
          <AdminNav />
        </div>

        <div className="p-4 border-t border-border">
          <div className="bg-elevated rounded-lg p-3">
            <p className="text-sm font-medium text-text-primary truncate">{session.user.name}</p>
            <p className="text-xs text-text-muted truncate">{session.user.email}</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>

      <EventsProvider>{null}</EventsProvider>
    </div>
  );
}
