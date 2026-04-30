import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { Role } from '@prisma/client';

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
 * Usage: export const POST = withRole(['ADMIN', 'SUPER_ADMIN'], async (req, session) => { ... })
 */
export function withRole(allowedRoles: Role[], handler: Handler) {
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

    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden: insufficient role' }, { status: 403 });
    }

    return handler(req, session);
  };
}
