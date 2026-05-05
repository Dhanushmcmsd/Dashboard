import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { SessionUser } from "@/types";

/**
 * Root page — no UI, just redirects based on session role.
 * - super_admin  → /admin
 * - others       → /:companySlug
 * - unauthenticated → /login  (handled by middleware, but belt-and-suspenders here)
 */
export default async function RootPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user as SessionUser;

  if (user.role === "super_admin") {
    redirect("/admin");
  }

  if (user.companySlug) {
    redirect(`/${user.companySlug}`);
  }

  // Fallback — misconfigured account
  redirect("/login");
}
