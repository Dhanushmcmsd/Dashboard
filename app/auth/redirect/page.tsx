"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function RedirectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user) {
      switch (session.user.role) {
        case "ADMIN":
          router.push("/admin/users");
          break;
        case "EMPLOYEE":
          router.push("/employee");
          break;
        case "MANAGEMENT":
          router.push("/management/daily");
          break;
        default:
          router.push("/login");
      }
    }
  }, [session, status, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0C]">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}
