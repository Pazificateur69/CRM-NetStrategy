import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, authError, forbiddenError } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, 'admin');

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const moods = await prisma.dailyMood.findMany({
      where: {
        date: { gte: sevenDaysAgo },
      },
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: { date: 'asc' },
    });

    // Group by date
    const historyMap = new Map<string, { date: string; moods: { user_id: number; user_name: string; mood: string }[] }>();

    for (const m of moods) {
      const dateStr = m.date.toISOString().split('T')[0];
      if (!historyMap.has(dateStr)) {
        historyMap.set(dateStr, { date: dateStr, moods: [] });
      }
      historyMap.get(dateStr)!.moods.push({
        user_id: m.user.id,
        user_name: m.user.name,
        mood: m.mood,
      });
    }

    const history = Array.from(historyMap.values());

    // Today's moods
    const todayStr = today.toISOString().split('T')[0];
    const todayMoods = historyMap.get(todayStr)?.moods ?? [];

    return Response.json({
      history,
      today: todayMoods,
    });
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    if (e.message === 'Forbidden') return forbiddenError();
    console.error('GET /api/mood/stats error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
