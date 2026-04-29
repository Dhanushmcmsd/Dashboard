import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AlertToast from "@/components/shared/AlertToast";
import Link from "next/link";
import { LogOut } from "lucide-react";
import SignOutButton from "@/components/employee/SignOutButton";

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "EMPLOYEE") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0C]">
      {/* Header */}
      <header className="bg-surface border-b border-border sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link href="/employee" className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Branch<span className="text-primary">Sync</span></h1>
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-text-primary">{session.user.name}</p>
              <p className="text-xs text-text-muted">Employee Portal</p>
            </div>
            <div className="w-px h-8 bg-border hidden md:block"></div>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>

      <AlertToast />
    </div>
  );
}
