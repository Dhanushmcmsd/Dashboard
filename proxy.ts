import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Routes accessible without auth
const PUBLIC_PATHS = [
  '/login',
  '/set-password',
  '/forgot-password',
  '/reset-password',
  '/api/auth',
  '/api/health',
];

// Role-to-path prefix mapping
const ROLE_PATHS: Record<string, string[]> = {
  ADMIN: ['/admin', '/management', '/employee'],
  MANAGEMENT: ['/management', '/employee'],
  EMPLOYEE: ['/employee'],
  SUPER_ADMIN: ['/admin', '/management', '/employee'],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Validate JWT
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = token.role as string;
  const allowedPrefixes = ROLE_PATHS[role] ?? [];

  // If path is role-specific and user lacks access → redirect to their dashboard
  const isRolePath = Object.values(ROLE_PATHS).flat().some((p) => pathname.startsWith(p));
  if (isRolePath && !allowedPrefixes.some((p) => pathname.startsWith(p))) {
    const forbiddenUrl = req.nextUrl.clone();
    forbiddenUrl.pathname = allowedPrefixes[0] ?? '/login';
    return NextResponse.redirect(forbiddenUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
