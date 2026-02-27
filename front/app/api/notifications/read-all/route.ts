import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, authError } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const currentUser = await requireAuth(req);

    await prisma.notification.updateMany({
      where: {
        userId: currentUser.id,
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    return Response.json({ message: 'All marked as read' });
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    console.error('POST /api/notifications/read-all error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
