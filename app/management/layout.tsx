"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import AlertToast from "@/components/shared/AlertToast";
import type { SessionUser } from "@/types";

const TABS = [
  { label: "🛒 Supermarket", href: "/management/supermarket" },
  { label: "🥇 Gold Loan", href: "/management/gold-loan" },
  { label: "📊 ML Loan", href: "/management/ml-loan" },
  { label: "🚗 Vehicle Loan", href: "/management/vehicle-loan" },
  { label: "👤 Personal Loan", href: "/management/personal-loan" },
  { label: "📅 Daily", href: "/management/daily" },
  { label: "📆 Monthly", href: "/management/monthly" },
  { label: "🔔 Alerts", href: "/management/alerts" },
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-text-muted animate-pulse text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AlertToast />
      <header className="h-14 bg-surface border-b border-border flex items-center px-6 gap-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
            <span className="text-sm">📈</span>
          </div>
          <span className="text-text-main font-bold text-sm">Branch Dashboard</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-success/20 flex items-center justify-center text-xs font-bold text-success">
              {(session?.user?.name ?? "M")[0].toUpperCase()}
            </div>
            <span className="text-text-muted text-sm hidden sm:block">{session?.user?.name}</span>
          </div>
          <Link href="/api/auth/signout" className="text-xs text-danger/70 hover:text-danger transition px-2 py-1">
            Sign out
          </Link>
        </div>
      </header>

      <nav className="bg-surface border-b border-border overflow-x-auto shrink-0">
        <div className="flex px-4 min-w-max">
          {TABS.map((tab) => {
            const isActive = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`px-4 py-3 text-sm whitespace-nowrap border-b-2 transition font-medium ${
                  isActive
                    ? "border-primary text-text-main"
                    : "border-transparent text-text-muted hover:text-text-main hover:border-border"
                }`}
              >
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
