"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import AlertToast from "@/components/shared/AlertToast";
import type { SessionUser } from "@/types";

const TABS = [
  { label: "Supermarket", icon: "🛒", href: "/management/supermarket" },
  { label: "Gold Loan", icon: "🥇", href: "/management/gold-loan" },
  { label: "ML Loan", icon: "📊", href: "/management/ml-loan" },
  { label: "Vehicle Loan", icon: "🚗", href: "/management/vehicle-loan" },
  { label: "Personal Loan", icon: "👤", href: "/management/personal-loan" },
  { label: "Daily", icon: "📅", href: "/management/daily" },
  { label: "Monthly", icon: "📆", href: "/management/monthly" },
  { label: "Alerts", icon: "🔔", href: "/management/alerts" },
];

export default function ManagementLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "loading") return;
    if (!session || (session.user as SessionUser).role !== "MANAGEMENT") {
      router.replace("/login");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0A0C" }}>
        <div className="text-sm animate-pulse" style={{ color: "#64748B" }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0A0A0C" }}>
      <AlertToast />
      <header
        className="flex items-center px-6 gap-4 shrink-0 sticky top-0 z-30"
        style={{ background: "#0D0D12", borderBottom: "1px solid rgba(255,255,255,0.04)", height: "52px" }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold text-white" style={{ background: "#DC2626" }}>
            BS
          </div>
          <span className="font-semibold text-sm" style={{ color: "#E2E8F0" }}>BranchSync</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "rgba(22,163,74,0.15)", color: "#4ADE80" }}>
              {(session?.user?.name ?? "M")[0].toUpperCase()}
            </div>
            <span className="text-sm hidden sm:block" style={{ color: "#64748B" }}>{session?.user?.name}</span>
          </div>
          <Link href="/api/auth/signout" className="text-xs px-2 py-1 rounded-lg transition-colors" style={{ color: "#64748B" }}>
            Sign out
          </Link>
        </div>
      </header>
      <nav className="overflow-x-auto shrink-0 sticky z-20" style={{ background: "#0D0D12", borderBottom: "1px solid rgba(255,255,255,0.04)", top: "52px" }}>
        <div className="flex px-4 min-w-max">
          {TABS.map((tab) => {
            const isActive = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex items-center gap-1.5 px-4 py-3 text-sm whitespace-nowrap border-b-2 transition-all font-medium"
                style={isActive ? { borderColor: "#DC2626", color: "#E2E8F0" } : { borderColor: "transparent", color: "#64748B" }}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>
      <main className="flex-1 p-6 overflow-y-auto">{children}</main>
    </div>
  );
}
