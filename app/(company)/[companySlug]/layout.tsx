import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DashboardNav from "@/components/nav/DashboardNav";
import type { SessionUser } from "@/types";

export default async function CompanyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ companySlug: string }>;
}) {
  const { companySlug } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect("/login");

  const user = session.user as SessionUser;

  // super_admin may visit any company slug; others must own it
  if (user.role !== "super_admin" && user.companySlug !== companySlug) {
    redirect("/login");
  }

  // Fetch active portfolios for the company (drives nav links)
  const company = await prisma.company.findUnique({
    where: { slug: companySlug },
    select: {
      id: true,
      name: true,
      portfolios: {
        where: { isActive: true },
        select: { id: true, type: true, phase: true },
        orderBy: { type: "asc" },
      },
    },
  });

  if (!company) redirect("/404");

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f7fff0]">
      <DashboardNav
        companySlug={companySlug}
        companyName={company.name}
        portfolios={company.portfolios}
        userRole={user.role}
        userName={user.name ?? ""}
        userEmail={user.email}
      />
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
