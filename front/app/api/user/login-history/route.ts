import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, authError } from '@/lib/auth';
import { formatResponse } from '@/lib/format';

export async function GET(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);

    const loginHistory = await prisma.loginHistory.findMany({
      where: { userId: authUser.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        status: true,
        details: true,
        createdAt: true,
      },
    });

    return Response.json(formatResponse(loginHistory));
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthenticated') {
      return authError();
    }
    console.error('Get login history error:', error);
    return Response.json(
      { message: 'An error occurred while fetching login history' },
      { status: 500 }
    );
  }
}
