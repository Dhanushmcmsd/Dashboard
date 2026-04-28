"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { SessionUser } from "@/types";

export default function AuthRedirect() {
  const { data: session, status } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (status === "loading") return;
    if (!session) return router.push("/login");
    const role = (session.user as SessionUser).role;
    if (role === "ADMIN") router.push("/admin/users");
    else if (role === "EMPLOYEE") router.push("/employee");
    else if (role === "MANAGEMENT") router.push("/management/daily");
    else router.push("/login");
  }, [session, status, router]);
  return <div className="min-h-screen flex items-center justify-center bg-background text-text-muted">Redirecting...</div>;
}
