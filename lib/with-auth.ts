import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { AppRole } from '@/types';

type Handler = (req: NextRequest, session: Awaited<ReturnType<typeof getServerSession>>) => Promise<NextResponse>;

/**
 * Wraps an API route handler with session validation.
 * Usage: export const GET = withAuth(async (req, session) => { ... })
 */
export function withAuth(handler: Handler) {
  return async (req: NextRequest) => {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return handler(req, session);
  };
}

/**
 * Wraps an API route handler with session + role validation.
 * SUPER_ADMIN is always allowed through regardless of allowedRoles.
 * Usage: export const POST = withRole(['company_admin'], async (req, session) => { ... })
 */
export function withRole(allowedRoles: AppRole[], handler: Handler) {
  return async (req: NextRequest) => {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true, isActive: true },
    });

    if (!user?.isActive) {
      return NextResponse.json({ error: 'Account inactive' }, { status: 403 });
    }

    const isSuperAdmin = (user.role as AppRole) === 'super_admin';
    if (!isSuperAdmin && !allowedRoles.includes(user.role as AppRole)) {
      return NextResponse.json({ error: 'Forbidden: insufficient role' }, { status: 403 });
    }

    return handler(req, session);
  };
}
