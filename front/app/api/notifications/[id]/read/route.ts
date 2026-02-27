import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, authError } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth(req);
    const { id } = await params;
    const notifId = parseInt(id, 10);

    const notification = await prisma.notification.findUnique({
      where: { id: notifId },
    });

    if (!notification) {
      return Response.json({ message: 'Notification not found' }, { status: 404 });
    }

    if (notification.userId !== currentUser.id) {
      return Response.json({ message: 'Forbidden' }, { status: 403 });
    }

    await prisma.notification.update({
      where: { id: notifId },
      data: { readAt: new Date() },
    });

    return Response.json({ message: 'Marked as read' });
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    console.error('POST /api/notifications/[id]/read error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
