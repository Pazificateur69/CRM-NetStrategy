import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, authError, getPoleFromRole } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        pole: true,
        notificationPreferences: true,
        dashboardPreferences: true,
        twoFactorConfirmedAt: true,
      },
    });

    if (!user) {
      return authError('User not found', 404);
    }

    return Response.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      pole: user.pole || getPoleFromRole(user.role),
      two_factor_enabled: user.twoFactorConfirmedAt !== null,
      notification_preferences: user.notificationPreferences,
      dashboard_preferences: user.dashboardPreferences,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthenticated') {
      return authError();
    }
    console.error('Get user error:', error);
    return Response.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
