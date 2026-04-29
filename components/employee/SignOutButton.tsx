"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button 
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="p-2 text-text-muted hover:text-white hover:bg-elevated rounded-lg transition-colors"
      title="Sign Out"
    >
      <LogOut className="w-5 h-5" />
    </button>
  );
}
