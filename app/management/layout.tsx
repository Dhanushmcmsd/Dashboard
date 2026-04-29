"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LogOut, Loader2, Calendar, CalendarDays, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import AlertToast from "@/components/shared/AlertToast";
import { BRANCHES } from "@/types";
import { signOut } from "next-auth/react";

const navItems = [
  { name: "Supermarket", icon: "🛒", path: "/management/supermarket" },
  { name: "Gold Loan", icon: "🥇", path: "/management/gold-loan" },
  { name: "ML Loan", icon: "📊", path: "/management/ml-loan" },
  { name: "Vehicle Loan", icon: "🚗", path: "/management/vehicle-loan" },
  { name: "Personal Loan", icon: "👤", path: "/management/personal-loan" },
  { name: "Daily", icon: <Calendar className="w-4 h-4" />, path: "/management/daily" },
  { name: "Monthly", icon: <CalendarDays className="w-4 h-4" />, path: "/management/monthly" },
  { name: "Alerts", icon: <Bell className="w-4 h-4" />, path: "/management/alerts" },
];

export default function ManagementLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center bg-[#0A0A0C]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (status === "unauthenticated" || session?.user?.role !== "MANAGEMENT") {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0C]">
      {/* Top Header */}
      <header className="bg-surface border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Branch<span className="text-primary">Sync</span></h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-text-primary">{session.user.name}</p>
              <p className="text-xs text-text-muted">Management</p>
            </div>
            <div className="w-px h-8 bg-border hidden md:block"></div>
            <button 
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-2 text-text-muted hover:text-white hover:bg-elevated rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 overflow-x-auto hide-scrollbar border-t border-border/50">
          <nav className="flex space-x-1 py-2">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-text-muted hover:text-text-primary hover:bg-elevated"
                  )}
                >
                  <span className="flex items-center justify-center">{item.icon}</span>
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>

      <AlertToast />
    </div>
  );
}
