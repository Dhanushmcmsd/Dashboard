import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import AlertToast from "@/components/shared/AlertToast";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "ADMIN") redirect("/login");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AlertToast />
      <header className="h-14 bg-surface border-b border-border flex items-center px-6 gap-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
            <span className="text-sm">⚙️</span>
          </div>
          <span className="text-text-main font-bold text-sm">Admin Panel</span>
        </div>
        <nav className="flex gap-1 ml-6">
          <Link
            href="/admin/users"
            className="px-3 py-1.5 rounded-lg text-sm text-text-muted hover:text-text-main hover:bg-border/40 transition"
          >
            Users
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
              {(session.user?.name ?? "A")[0].toUpperCase()}
            </div>
            <span className="text-text-muted text-sm hidden sm:block">{session.user?.name}</span>
          </div>
          <Link href="/api/auth/signout" className="text-xs text-danger/70 hover:text-danger transition px-2 py-1">
            Sign out
          </Link>
        </div>
      </header>
      <main className="flex-1 p-6 overflow-y-auto">{children}</main>
    </div>
  );
}
