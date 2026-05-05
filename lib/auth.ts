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
          // Include organizationId so it flows into the JWT
          select: {
            id:             true,
            name:           true,
            email:          true,
            password:       true,
            role:           true,
            branches:       true,
            isActive:       true,
            passwordSet:    true,
            organizationId: true,
          },
        });

        if (!user) {
          throw new Error("No account found with this email");
        }

        if (!user.isActive) {
          throw new Error("Your account is pending admin approval");
        }

        if (!user.passwordSet) {
          throw new Error("Password not set. Please use your setup link");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error("Incorrect password");
        }

        return {
          id:             user.id,
          name:           user.name,
          email:          user.email,
          role:           user.role as AppRole,
          branches:       user.branches,
          // null for SUPER_ADMIN accounts not tied to an org
          organizationId: user.organizationId ?? null,
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
        // First sign-in: copy from the authorize() return value
        token.userId         = user.id;
        token.role           = (user as any).role as AppRole;
        token.branches       = (user as any).branches as string[];
        token.organizationId = (user as any).organizationId as string | null;
      }
      return token;
    },

    /**
     * Session callback — runs on every getServerSession() call.
     * Copies token fields → session.user so components/routes
     * always read from session, never from the token directly.
     */
    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          // Use token.userId (set above) as the canonical id
          id:             token.userId as string,
          role:           token.role as AppRole,
          branches:       token.branches as string[],
          organizationId: token.organizationId as string | null,
        };
      }
      return session;
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
