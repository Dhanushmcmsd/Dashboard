import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

/** Canonical role union — must match Prisma Role enum exactly */
export type AppRole = "SUPER_ADMIN" | "ADMIN" | "MANAGEMENT" | "EMPLOYEE";

declare module "next-auth" {
  interface Session {
    user: {
      /** Prisma User.id (cuid) */
      id: string;
      role: AppRole;
      branches: string[];
      /**
       * Prisma User.organizationId
       * null for SUPER_ADMIN (cross-org access)
       * always set for ADMIN / EMPLOYEE / MANAGEMENT
       */
      organizationId: string | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
    role: AppRole;
    branches: string[];
    organizationId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    /** Copied from User.id at sign-in */
    userId: string;
    role: AppRole;
    branches: string[];
    organizationId: string | null;
  }
}
