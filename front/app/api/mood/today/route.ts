import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, authError } from '@/lib/auth';
import { formatRecord } from '@/lib/format';

export async function GET(req: NextRequest) {
  try {
    const currentUser = await requireAuth(req);

    const today = new Date();
    const dateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const mood = await prisma.dailyMood.findUnique({
      where: {
        userId_date: {
          userId: currentUser.id,
          date: dateOnly,
        },
      },
    });

    return Response.json(mood ? formatRecord(mood) : null);
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    console.error('GET /api/mood/today error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
