import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";
import { SessionUser } from "@/types";

type RequireAuthResult = 
  | { error: string; status: number; user?: never }
  | { error?: never; status?: never; user: SessionUser };

export async function requireAuth(allowedRoles?: string[]): Promise<RequireAuthResult> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return { error: "Unauthorized", status: 401 };
  }

  const user = session.user as SessionUser;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return { error: "Forbidden", status: 403 };
  }

  return { user };
}
