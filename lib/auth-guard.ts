import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";
import { SessionUser } from "@/types";
import { prisma } from "@/lib/prisma";

type RequireAuthResult =
  | { error: string; status: number; user?: never }
  | { error?: never; status?: never; user: SessionUser };

/**
 * allowedRoles: if provided, user.role must be in this list.
 * Pass ["MANAGEMENT"] to allow only MANAGEMENT.
 * Pass ["ADMIN"] to allow only ADMIN.
 * Pass ["EMPLOYEE"] to allow only EMPLOYEE.
 * Pass ["MANAGEMENT", "ADMIN"] to allow both.
 * Pass nothing / undefined to allow any authenticated user.
 */
export async function requireAuth(allowedRoles?: string[]): Promise<RequireAuthResult> {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return { error: "Unauthorized", status: 401 };
  }

  const user = session.user as SessionUser;

  // Always verify the user is still active in the DB
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { isActive: true },
  });

  if (!dbUser || !dbUser.isActive) {
    return { error: "Account is deactivated", status: 401 };
  }

  // If specific roles are required, check membership
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return { error: "Forbidden", status: 403 };
  }

  return { user };
}