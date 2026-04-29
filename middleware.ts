import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (path.startsWith("/admin") && token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/auth/redirect", req.url));
    }

    if (path.startsWith("/employee") && token.role !== "EMPLOYEE") {
      return NextResponse.redirect(new URL("/auth/redirect", req.url));
    }

    if (path.startsWith("/management") && token.role !== "MANAGEMENT") {
      return NextResponse.redirect(new URL("/auth/redirect", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/employee/:path*", "/management/:path*"],
};
