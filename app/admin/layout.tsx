import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import AlertToast from "@/components/shared/AlertToast";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "ADMIN") redirect("/login");

  return (
    <div className="min-h-screen flex" style={{ background: "#0A0A0C" }}>
      <AlertToast />

      {/* Sidebar */}
      <aside
        className="w-56 flex-shrink-0 flex flex-col h-screen sticky top-0"
        style={{
          background: "#0D0D12",
          borderRight: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ background: "#DC2626" }}
            >
              BS
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: "#E2E8F0" }}>BranchSync</div>
              <div className="text-xs" style={{ color: "#64748B" }}>Admin Panel</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <p className="text-xs font-medium uppercase tracking-widest px-2 mb-3" style={{ color: "#64748B" }}>
            Management
          </p>
          <Link
            href="/admin/users"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
            style={{
              color: "#E2E8F0",
              background: "rgba(37,99,235,0.08)",
              borderLeft: "3px solid #DC2626",
            }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Users
          </Link>
        </nav>

        {/* User info at bottom */}
        <div
          className="px-4 py-4 border-t"
          style={{ borderColor: "rgba(255,255,255,0.04)" }}
        >
          <div className="flex items-center gap-2.5 mb-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ background: "#DC2626" }}
            >
              {(session.user?.name ?? "A")[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium truncate" style={{ color: "#E2E8F0" }}>
                {session.user?.name}
              </div>
              <div className="text-xs" style={{ color: "#64748B" }}>Administrator</div>
            </div>
          </div>
          <Link
            href="/api/auth/signout"
            className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg transition-colors w-full"
            style={{ color: "#64748B" }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  );
}
