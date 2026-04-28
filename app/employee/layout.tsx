import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function EmployeeLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "EMPLOYEE") redirect("/login");
  return <div className="min-h-screen bg-background p-6 max-w-3xl mx-auto">{children}</div>;
}
