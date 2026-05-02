"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, LogOut, ScrollText } from "lucide-react";
import { signOut } from "next-auth/react";

export default function AdminNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/admin/users",  label: "User Management", icon: Users },
    { href: "/admin/audit", label: "Audit Log",        icon: ScrollText },
  ];

  return (
    <nav className="space-y-1 py-2">
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={[
              "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium",
              "transition-all duration-200",
              isActive
                ? "bg-[#064734] text-white shadow-lg shadow-[#064734]/20"
                : "text-[#4a7c5f] hover:bg-[#f0fce8] hover:text-[#064734]",
            ].join(" ")}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        );
      })}

      <div className="pt-2">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-[#4a7c5f] hover:bg-red-50 hover:text-[#991b1b] transition-all duration-200 text-left"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </nav>
  );
}
