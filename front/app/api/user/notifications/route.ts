import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, authError } from '@/lib/auth';

export async function PUT(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);

    const body = await req.json();
    const { preferences } = body;

    if (!preferences || typeof preferences !== 'object') {
      return Response.json(
        { message: 'Preferences object is required' },
        { status: 422 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: authUser.id },
      data: {
        notificationPreferences: preferences,
      },
      select: {
        notificationPreferences: true,
      },
    });

    return Response.json({
      notification_preferences: updatedUser.notificationPreferences,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthenticated') {
      return authError();
    }
    console.error('Update notification preferences error:', error);
    return Response.json(
      { message: 'An error occurred while updating notification preferences' },
      { status: 500 }
    );
  }
}
