import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";

export default async function ManagementLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "MANAGEMENT") redirect("/login");
  return <div className="min-h-screen bg-background"><nav className="p-4 border-b border-border flex gap-3"><Link href="/management/daily">Daily</Link><Link href="/management/monthly">Monthly</Link><Link href="/management/alerts">Alerts</Link></nav><main className="p-6">{children}</main></div>;
}
