import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { LoginSchema } from "./validations";
import type { SessionUser } from "@/types";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login", signOut: "/login", error: "/login" },
  providers: [CredentialsProvider({ name: "credentials", credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" } }, async authorize(credentials) {
    const parsed = LoginSchema.safeParse(credentials);
    if (!parsed.success) return null;
    const user = await prisma.user.findUnique({ where: { email: parsed.data.email }, select: { id: true, name: true, email: true, password: true, role: true, branches: true, isActive: true } });
    if (!user || !user.isActive) return null;
    const valid = await bcrypt.compare(parsed.data.password, user.password);
    if (!valid) return null;
    return { id: user.id, name: user.name, email: user.email, role: user.role, branches: user.branches };
  } })],
  callbacks: {
    async jwt({ token, user }) { if (user) { token.id = (user as SessionUser & { id: string }).id; token.role = (user as SessionUser).role; token.branches = (user as SessionUser).branches; } return token; },
    async session({ session, token }) { if (session.user) { (session.user as SessionUser).id = token.id as string; (session.user as SessionUser).role = token.role as SessionUser["role"]; (session.user as SessionUser).branches = token.branches as string[]; } return session; }
  }
};
