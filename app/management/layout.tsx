"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
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
import { cn } from "@/lib/utils";
import EventsProvider from "@/components/providers/EventsProvider";
import { signOut } from "next-auth/react";

const branchItems = [
  { name: "Supermarket", icon: ShoppingCart, path: "/management/supermarket" },
  { name: "Gold Loan",   icon: Coins,        path: "/management/gold-loan"   },
  { name: "ML Loan",     icon: BarChart2,    path: "/management/ml-loan"     },
  { name: "Vehicle Loan",icon: CarFront,     path: "/management/vehicle-loan"},
  { name: "Personal Loan",icon: UserCircle2, path: "/management/personal-loan"},
] as const;

const topNavItems = [
  { name: "Daily",   icon: Calendar,    path: "/management/daily"   },
  { name: "Monthly", icon: CalendarDays, path: "/management/monthly" },
  { name: "Alerts",  icon: Bell,        path: "/management/alerts"  },
] as const;

const BRANCH_PATHS = branchItems.map((b) => b.path);

type DropdownPos = { top: number; left: number; width: number };

export default function ManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router   = useRouter();
  const pathname = usePathname();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownPos,  setDropdownPos]  = useState<DropdownPos>({ top: 0, left: 0, width: 208 });
  const [mounted,      setMounted]      = useState(false);

  const triggerRef  = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isBranchActive = BRANCH_PATHS.some((p) => pathname === p);

  // Portal needs browser
  useEffect(() => { setMounted(true); }, []);

  // Position dropdown below the trigger button using page-absolute coords
  const openDropdown = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setDropdownPos({
      top:   rect.bottom + window.scrollY + 6,
      left:  rect.left   + window.scrollX,
      width: Math.max(rect.width, 208),
    });
    setDropdownOpen(true);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    function handleMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) return;
      setDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [dropdownOpen]);

  // Close on scroll / resize so it doesn't float in the wrong place
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
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0C]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status === "unauthenticated" || session?.user?.role !== "MANAGEMENT") {
    router.push("/login");
    return null;
  }

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
      className="bg-surface border border-border rounded-xl shadow-2xl overflow-hidden"
    >
      {branchItems.map((item) => {
        const Icon     = item.icon;
        const isActive = pathname === item.path;
        return (
          <button
            key={item.name}
            onClick={() => {
              router.push(item.path);
              setDropdownOpen(false);
            }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors text-left",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-text-muted hover:text-text-primary hover:bg-elevated"
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {item.name}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0C]">
      <header className="bg-surface border-b border-border sticky top-0 z-40">
        {/* Top bar */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white tracking-tight">
            Branch<span className="text-primary">Sync</span>
          </h1>

          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-text-primary">{session.user.name}</p>
              <p className="text-xs text-text-muted">Management</p>
            </div>
            <div className="w-px h-8 bg-border hidden md:block" />
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-2 text-text-muted hover:text-white hover:bg-elevated rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab bar — overflow-x-auto but dropdown escapes via portal */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 overflow-x-auto hide-scrollbar border-t border-border/50">
          <nav className="flex space-x-1 py-2">

            {/* Branches trigger */}
            <button
              ref={triggerRef}
              onClick={() => dropdownOpen ? setDropdownOpen(false) : openDropdown()}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                isBranchActive || dropdownOpen
                  ? "bg-primary/10 text-primary"
                  : "text-text-muted hover:text-text-primary hover:bg-elevated"
              )}
            >
              <ShoppingCart className="w-4 h-4" />
              Branches
              <ChevronDown
                className={cn(
                  "w-3.5 h-3.5 transition-transform duration-200",
                  dropdownOpen ? "rotate-180" : ""
                )}
              />
            </button>

            {topNavItems.map((item) => {
              const Icon     = item.icon;
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
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>

      <EventsProvider>{null}</EventsProvider>

      {/* Portal: dropdown renders into body, escaping all overflow/z-index containers */}
      {mounted && dropdownOpen && createPortal(dropdownPanel, document.body)}
    </div>
  );
}
