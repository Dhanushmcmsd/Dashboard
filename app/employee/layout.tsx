import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import SignOutButton from "@/components/employee/SignOutButton";
import EventsProvider from "@/components/providers/EventsProvider";

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "EMPLOYEE") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f7fff0]">
      {/* Header */}
      <header className="bg-white border-b border-[#c8e6c0] sticky top-0 z-40 shadow-[0_2px_8px_rgba(6,71,52,0.06)]">
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link href="/employee" className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#064734] tracking-tight">
              Branch<span className="text-[#22c55e]">Sync</span>
            </h1>
          </Link>

          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-sm font-semibold text-[#064734]">{session.user.name}</p>
              <p className="text-xs text-[#4a7c5f]">Employee Portal</p>
            </div>
            <div className="w-px h-8 bg-[#c8e6c0] hidden md:block" />
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

      <EventsProvider>{null}</EventsProvider>
    </div>
  );
}
