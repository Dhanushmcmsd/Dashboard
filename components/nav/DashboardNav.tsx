"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { AppRole } from "@/types";

// Portfolio type → URL slug mapping
const PORTFOLIO_SLUGS: Record<string, string> = {
  GOLD_LOAN:     "gold-loan",
  ML_LOAN:       "ml-loan",
  VEHICLE_LOAN:  "vehicle-loan",
  PERSONAL_LOAN: "personal-loan",
  SUPERMARKET:   "supermarket",
};

// Human-readable labels
const PORTFOLIO_LABELS: Record<string, string> = {
  GOLD_LOAN:     "Gold Loan",
  ML_LOAN:       "ML Loan",
  VEHICLE_LOAN:  "Vehicle Loan",
  PERSONAL_LOAN: "Personal Loan",
  SUPERMARKET:   "Supermarket",
};

type Portfolio = {
  id: string;
  type: string;
  phase: string;
};

type Props = {
  companySlug: string;
  companyName: string;
  portfolios: Portfolio[];
  userRole: AppRole;
  userName: string;
  userEmail: string;
};

export default function DashboardNav({
  companySlug,
  companyName,
  portfolios,
  userRole,
  userName,
  userEmail,
}: Props) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const linkCls = (href: string) =>
    [
      "flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
      isActive(href)
        ? "bg-[#064734] text-white"
        : "text-[#4a7c5f] hover:bg-[#f0fce8] hover:text-[#064734]",
    ].join(" ");

  const canUpload = userRole === "employee" || userRole === "company_admin" || userRole === "super_admin";
  const canViewDashboard = userRole === "company_admin" || userRole === "super_admin";

  return (
    <aside className="w-full md:w-64 bg-white border-r border-[#c8e6c0] shrink-0 flex flex-col shadow-[2px_0_12px_rgba(6,71,52,0.06)]">
      {/* Logo / company name */}
      <div className="p-6 border-b border-[#c8e6c0]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#064734] rounded-xl flex items-center justify-center shrink-0">
            <Image
              src="/logo.svg"
              alt={companyName}
              width={22}
              height={22}
              className="invert"
              style={{ objectFit: "contain" }}
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#064734] leading-tight truncate">{companyName}</p>
            <p className="text-[10px] text-[#4a7c5f] uppercase tracking-widest">MIS</p>
          </div>
        </div>
        {/* Role badge */}
        <div className="mt-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#f0fce8] border border-[#c8e6c0] rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-[#064734]" />
            <span className="text-[10px] font-semibold text-[#064734] uppercase tracking-wider">
              {userRole.replace("_", " ")}
            </span>
          </span>
        </div>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {/* Home */}
        {canViewDashboard && (
          <Link href={`/${companySlug}`} className={linkCls(`/${companySlug}`)}>
            <span>🏠</span>
            <span>Dashboard Home</span>
          </Link>
        )}

        {/* Portfolio links — DB-driven */}
        {canViewDashboard && portfolios.length > 0 && (
          <>
            <p className="px-3 pt-4 pb-1 text-[10px] font-semibold text-[#4a7c5f] uppercase tracking-wider">
              Portfolios
            </p>
            {portfolios.map((p) => {
              const slug  = PORTFOLIO_SLUGS[p.type] ?? p.type.toLowerCase().replace("_", "-");
              const label = PORTFOLIO_LABELS[p.type] ?? p.type;
              const href  = `/${companySlug}/${slug}`;
              return (
                <Link key={p.id} href={href} className={linkCls(href)}>
                  <span>📊</span>
                  <span>{label}</span>
                  {p.phase === "ONBOARDING" && (
                    <span className="ml-auto text-[9px] bg-amber-100 text-amber-700 rounded-full px-1.5 py-0.5 font-semibold">
                      Soon
                    </span>
                  )}
                </Link>
              );
            })}
          </>
        )}

        {/* Upload */}
        {canUpload && (
          <>
            <p className="px-3 pt-4 pb-1 text-[10px] font-semibold text-[#4a7c5f] uppercase tracking-wider">
              Data
            </p>
            <Link href={`/${companySlug}/upload`} className={linkCls(`/${companySlug}/upload`)}>
              <span>📤</span>
              <span>Upload</span>
            </Link>
          </>
        )}
      </nav>

      {/* User footer + sign out */}
      <div className="p-4 border-t border-[#c8e6c0] space-y-2">
        <div className="bg-[#f0fce8] border border-[#c8e6c0] rounded-2xl px-4 py-3">
          <p className="text-sm font-semibold text-[#064734] truncate">{userName}</p>
          <p className="text-xs text-[#4a7c5f] truncate mt-0.5">{userEmail}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full text-left px-3 py-2 rounded-xl text-sm text-[#4a7c5f] hover:bg-[#f0fce8] hover:text-[#064734] transition-colors font-medium"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
