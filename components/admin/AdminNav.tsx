"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1.5">
      <Link
        href="/admin/users"
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
          pathname === "/admin/users" 
            ? "bg-primary/10 text-primary" 
            : "text-text-muted hover:bg-elevated hover:text-text-primary"
        )}
      >
        <Users className="w-4 h-4" />
        User Management
      </Link>
      
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-text-muted hover:bg-elevated hover:text-text-primary transition-colors text-left"
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </button>
    </nav>
  );
}
