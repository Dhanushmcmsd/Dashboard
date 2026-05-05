import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import type { AppRole } from "@/types";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email:    { label: "Email",    type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: {
            id:          true,
            name:        true,
            email:       true,
            password:    true,
            role:        true,
            isActive:    true,
            passwordSet: true,
            company: {
              select: { id: true, slug: true },
            },
          },
        });

        if (!user) throw new Error("No account found with this email");
        if (!user.isActive) throw new Error("Your account is pending admin approval");
        if (!user.passwordSet) throw new Error("Password not set. Please use your setup link");

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) throw new Error("Incorrect password");

        return {
          id:          user.id,
          name:        user.name,
          email:       user.email,
          role:        user.role as AppRole,
          companyId:   user.company?.id   ?? null,
          companySlug: user.company?.slug ?? null,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge:   8 * 60 * 60, // 8 hours
  },

  callbacks: {
    /**
     * JWT callback — runs on sign-in and every token refresh.
     * Persist custom fields into the token so they survive
     * between requests without hitting the DB.
     */
    async jwt({ token, user }) {
      if (user) {
        token.userId      = user.id;
        token.role        = (user as any).role        as AppRole;
        token.companyId   = (user as any).companyId   as string | null;
        token.companySlug = (user as any).companySlug as string | null;
      }
      return token;
    },

    /**
     * Session callback — runs on every getServerSession() call.
     * Copies token fields → session.user.
     */
    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          userId:      token.userId      as string,
          role:        token.role        as AppRole,
          companyId:   token.companyId   as string | null,
          companySlug: token.companySlug as string | null,
        };
      }
      return session;
    },

    /**
     * Redirect callback — send super_admin to /admin, others to /:companySlug.
     */
    async redirect({ url, baseUrl, token }: any) {
      // Only apply on sign-in (relative redirect from NextAuth)
      if (url.startsWith(baseUrl) || url === "/") {
        const role        = token?.role        as AppRole | undefined;
        const companySlug = token?.companySlug as string  | undefined;

        if (role === "super_admin") return `${baseUrl}/admin`;
        if (companySlug)            return `${baseUrl}/${companySlug}`;
      }
      return url.startsWith(baseUrl) ? url : baseUrl;
    },
  },

  pages: {
    signIn:  "/login",
    signOut: "/login",
    error:   "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,

  debug: process.env.NODE_ENV === "development",
};
