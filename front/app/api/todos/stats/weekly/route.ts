import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, hasPermission, authError, forbiddenError, AuthUser } from '@/lib/auth';
import { formatResponse, formatRecord, toSnake } from '@/lib/format';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    const now = new Date();

    // Calculate start of this week (Monday)
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - diffToMonday);
    thisWeekStart.setHours(0, 0, 0, 0);

    // End of this week (Sunday)
    const thisWeekEnd = new Date(thisWeekStart);
    thisWeekEnd.setDate(thisWeekStart.getDate() + 7);

    // Start of last week
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(thisWeekStart.getDate() - 7);

    // End of last week = start of this week
    const lastWeekEnd = new Date(thisWeekStart);

    const thisWeekCompleted = await prisma.todo.count({
      where: {
        assignedTo: user.id,
        statut: 'termine',
        updatedAt: {
          gte: thisWeekStart,
          lt: thisWeekEnd,
        },
      },
    });

    const lastWeekCompleted = await prisma.todo.count({
      where: {
        assignedTo: user.id,
        statut: 'termine',
        updatedAt: {
          gte: lastWeekStart,
          lt: lastWeekEnd,
        },
      },
    });

    let trend: 'up' | 'down' | 'stable';
    if (thisWeekCompleted > lastWeekCompleted) {
      trend = 'up';
    } else if (thisWeekCompleted < lastWeekCompleted) {
      trend = 'down';
    } else {
      trend = 'stable';
    }

    return Response.json({
      this_week: thisWeekCompleted,
      last_week: lastWeekCompleted,
      trend,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthenticated') {
      return authError();
    }
    console.error('GET /api/todos/stats/weekly error:', error);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
