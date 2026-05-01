import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";
import EventsProvider from "@/components/providers/EventsProvider";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0A0A0C]">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-surface border-r border-border shrink-0 flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-white tracking-tight">Branch<span className="text-primary">Sync</span></h1>
          <p className="text-xs text-text-muted uppercase mt-1 tracking-wider">Admin Portal</p>
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
