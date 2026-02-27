import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, authError } from '@/lib/auth';
import { formatRecord } from '@/lib/format';

export async function GET(req: NextRequest) {
  try {
    const currentUser = await requireAuth(req);

    const notifications = await prisma.notification.findMany({
      where: { userId: currentUser.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return Response.json({ data: notifications.map(formatRecord) });
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    console.error('GET /api/notifications error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
