import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, authError } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);

    const recentLogins = await prisma.loginHistory.findMany({
      where: {
        userId: authUser.id,
        status: 'success',
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
      },
    });

    // Map login history to session-like format
    const sessions = recentLogins.map((login) => ({
      id: login.id,
      ip_address: login.ipAddress,
      user_agent: login.userAgent,
      last_active: login.createdAt,
      is_current: false, // We cannot reliably determine this
    }));

    // Mark the most recent session as likely current
    if (sessions.length > 0) {
      sessions[0].is_current = true;
    }

    return Response.json(sessions);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthenticated') {
      return authError();
    }
    console.error('Get active sessions error:', error);
    return Response.json(
      { message: 'An error occurred while fetching active sessions' },
      { status: 500 }
    );
  }
}
