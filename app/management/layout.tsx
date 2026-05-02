"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  LogOut,
  Loader2,
  Calendar,
  CalendarDays,
  Bell,
  ShoppingCart,
  Coins,
  BarChart2,
  CarFront,
  UserCircle2,
  ChevronDown,
} from "lucide-react";
import EventsProvider from "@/components/providers/EventsProvider";
import { signOut } from "next-auth/react";

const branchItems = [
  { name: "Supermarket",   icon: ShoppingCart, path: "/management/supermarket"   },
  { name: "Gold Loan",     icon: Coins,        path: "/management/gold-loan"     },
  { name: "ML Loan",       icon: BarChart2,    path: "/management/ml-loan"       },
  { name: "Vehicle Loan",  icon: CarFront,     path: "/management/vehicle-loan"  },
  { name: "Personal Loan", icon: UserCircle2,  path: "/management/personal-loan" },
] as const;

const topNavItems = [
  { name: "Daily",   icon: Calendar,     path: "/management/daily"   },
  { name: "Monthly", icon: CalendarDays, path: "/management/monthly" },
  { name: "Alerts",  icon: Bell,         path: "/management/alerts"  },
] as const;

const BRANCH_PATHS = branchItems.map((b) => b.path);

type DropdownPos = { top: number; left: number; width: number };

export default function ManagementLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router   = useRouter();
  const pathname = usePathname();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownPos,  setDropdownPos]  = useState<DropdownPos>({ top: 0, left: 0, width: 208 });
  const [mounted,      setMounted]      = useState(false);

  const triggerRef  = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isBranchActive = BRANCH_PATHS.some((p) => pathname === p);

  useEffect(() => { setMounted(true); }, []);

  const openDropdown = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setDropdownPos({
      top:   rect.bottom + window.scrollY + 6,
      left:  rect.left   + window.scrollX,
      width: Math.max(rect.width, 220),
    });
    setDropdownOpen(true);
  }, []);

  useEffect(() => {
    if (!dropdownOpen) return;
    function handleMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || dropdownRef.current?.contains(target)) return;
      setDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [dropdownOpen]);

  useEffect(() => {
    if (!dropdownOpen) return;
    const close = () => setDropdownOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [dropdownOpen]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7fff0]">
        <Loader2 className="w-8 h-8 animate-spin text-[#064734]" />
      </div>
    );
  }

  if (status === "unauthenticated" || session?.user?.role !== "MANAGEMENT") {
    router.push("/login");
    return null;
  }

  // ── Branch dropdown portal ──────────────────────────────────────────────────
  const dropdownPanel = (
    <div
      ref={dropdownRef}
      style={{
        position: "absolute",
        top:      dropdownPos.top,
        left:     dropdownPos.left,
        width:    dropdownPos.width,
        zIndex:   9999,
      }}
      className="bg-white border border-[#c8e6c0] rounded-2xl shadow-[0_8px_32px_rgba(6,71,52,0.14)] overflow-hidden py-1"
    >
      {branchItems.map((item) => {
        const Icon     = item.icon;
        const isActive = pathname === item.path;
        return (
          <button
            key={item.name}
            onClick={() => { router.push(item.path); setDropdownOpen(false); }}
            className={[
              "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-150 text-left",
              isActive
                ? "bg-[#064734] text-white"
                : "text-[#4a7c5f] hover:bg-[#f0fce8] hover:text-[#064734]",
            ].join(" ")}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {item.name}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#f7fff0]">

      {/* ── Sticky header ── */}
      <header className="bg-white border-b border-[#c8e6c0] sticky top-0 z-40 shadow-[0_2px_12px_rgba(6,71,52,0.07)]">

        {/* Top bar — logo + user */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#064734] rounded-xl flex items-center justify-center shrink-0">
              <Image
                src="/logo.svg"
                alt="Supra Pacific"
                width={20}
                height={20}
                className="invert"
                style={{ objectFit: "contain" }}
              />
            </div>
            <div>
              <p className="text-sm font-bold text-[#064734] leading-tight">Supra Pacific</p>
              <p className="text-[10px] text-[#4a7c5f] uppercase tracking-widest">Management MIS</p>
            </div>
          </div>

          {/* User + sign-out */}
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-sm font-semibold text-[#064734]">{session.user.name}</p>
              <p className="text-xs text-[#4a7c5f]">Management</p>
            </div>
            <div className="w-px h-8 bg-[#c8e6c0] hidden md:block" />
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-2 text-[#4a7c5f] hover:text-[#991b1b] hover:bg-red-50 rounded-xl transition-all duration-200"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 overflow-x-auto hide-scrollbar">
          <nav className="flex space-x-1 pb-0">

            {/* Branches dropdown trigger */}
            <button
              ref={triggerRef}
              onClick={() => dropdownOpen ? setDropdownOpen(false) : openDropdown()}
              className={[
                "flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all whitespace-nowrap border-b-2",
                isBranchActive || dropdownOpen
                  ? "border-[#064734] text-[#064734]"
                  : "border-transparent text-[#4a7c5f] hover:text-[#064734] hover:border-[#c8e6c0]",
              ].join(" ")}
            >
              <ShoppingCart className="w-4 h-4" />
              Branches
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Top nav items */}
            {topNavItems.map((item) => {
              const Icon     = item.icon;
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  className={[
                    "flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all whitespace-nowrap border-b-2",
                    isActive
                      ? "border-[#064734] text-[#064734]"
                      : "border-transparent text-[#4a7c5f] hover:text-[#064734] hover:border-[#c8e6c0]",
                  ].join(" ")}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {mounted && dropdownOpen && createPortal(dropdownPanel, document.body)}
      <EventsProvider>{null}</EventsProvider>
    </div>
  );
}
