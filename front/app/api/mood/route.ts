import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, authError } from '@/lib/auth';
import { formatRecord } from '@/lib/format';

export async function POST(req: NextRequest) {
  try {
    const currentUser = await requireAuth(req);

    const body = await req.json();
    const { mood, comment } = body;

    if (!mood) {
      return Response.json({ message: 'mood is required' }, { status: 422 });
    }

    const today = new Date();
    const dateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const dailyMood = await prisma.dailyMood.upsert({
      where: {
        userId_date: {
          userId: currentUser.id,
          date: dateOnly,
        },
      },
      update: {
        mood,
        comment: comment || null,
      },
      create: {
        userId: currentUser.id,
        mood,
        comment: comment || null,
        date: dateOnly,
      },
    });

    return Response.json(formatRecord(dailyMood));
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    console.error('POST /api/mood error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
