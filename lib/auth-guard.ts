import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";
import { SessionUser } from "@/types";
import { prisma } from "@/lib/prisma";

type RequireAuthResult = 
  | { error: string; status: number; user?: never }
  | { error?: never; status?: never; user: SessionUser };

export async function requireAuth(allowedRoles?: string[]): Promise<RequireAuthResult> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return { error: "Unauthorized", status: 401 };
  }

  const user = session.user as SessionUser;

  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { isActive: true } });
  if (!dbUser || !dbUser.isActive) return { error: "Account is deactivated", status: 401 };

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return { error: "Forbidden", status: 403 };
  }

  return { user };
}
