"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="p-2 text-[#4a7c5f] hover:text-[#064734] hover:bg-[#f0fce8] rounded-xl transition-colors duration-150"
      title="Sign Out"
    >
      <LogOut className="w-5 h-5" />
    </button>
  );
}
