import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(function middleware(req) {
  const token = req.nextauth.token;
  const pathname = req.nextUrl.pathname;
  if (!token) return NextResponse.redirect(new URL("/login", req.url));
  const role = token.role as string;
  if (pathname.startsWith("/admin") && role !== "ADMIN") return NextResponse.redirect(new URL("/login", req.url));
  if (pathname.startsWith("/employee") && role !== "EMPLOYEE") return NextResponse.redirect(new URL("/login", req.url));
  if (pathname.startsWith("/management") && role !== "MANAGEMENT") return NextResponse.redirect(new URL("/login", req.url));
  return NextResponse.next();
}, { callbacks: { authorized: ({ token }) => !!token } });

export const config = { matcher: ["/admin/:path*", "/employee/:path*", "/management/:path*"] };
