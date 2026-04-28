// FILE: types/next-auth.d.ts
import { DefaultSession, DefaultJWT } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "EMPLOYEE" | "MANAGEMENT";
      branches: string[];
    } & DefaultSession["user"];
  }

  interface User {
    role: "ADMIN" | "EMPLOYEE" | "MANAGEMENT";
    branches: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: "ADMIN" | "EMPLOYEE" | "MANAGEMENT";
    branches: string[];
  }
}
