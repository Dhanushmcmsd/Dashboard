import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

/** Canonical role union — must match Prisma Role enum exactly */
export type AppRole = "super_admin" | "company_admin" | "employee";

declare module "next-auth" {
  interface Session {
    user: {
      /** Prisma User.id (cuid) */
      userId: string;
      email: string;
      role: AppRole;
      /** Prisma Company.id — null for super_admin */
      companyId: string | null;
      /** URL-safe company identifier — null for super_admin */
      companySlug: string | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
    role: AppRole;
    companyId: string | null;
    companySlug: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    userId: string;
    role: AppRole;
    companyId: string | null;
    companySlug: string | null;
  }
}
