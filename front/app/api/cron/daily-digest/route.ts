import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    // Verify CRON_SECRET for security
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true },
    });

    let processed = 0;

    for (const user of users) {
      // Get today's todos for the user
      const todayTodos = await prisma.todo.findMany({
        where: {
          OR: [{ assignedTo: user.id }, { userId: user.id }],
          dateEcheance: {
            gte: today,
            lt: tomorrow,
          },
        },
        select: { id: true, titre: true, statut: true, priorite: true },
      });

      // Get overdue items
      const overdueTodos = await prisma.todo.findMany({
        where: {
          OR: [{ assignedTo: user.id }, { userId: user.id }],
          dateEcheance: { lt: today },
          statut: { not: 'termine' },
        },
        select: { id: true, titre: true },
      });

      // Get upcoming rappels
      const upcomingRappels = await prisma.rappel.findMany({
        where: {
          assignedUsers: { some: { userId: user.id } },
          dateRappel: {
            gte: today,
            lt: tomorrow,
          },
          fait: false,
        },
        select: { id: true, titre: true },
      });

      // Create a daily digest notification if there is something to report
      const hasTodos = todayTodos.length > 0;
      const hasOverdue = overdueTodos.length > 0;
      const hasRappels = upcomingRappels.length > 0;

      if (hasTodos || hasOverdue || hasRappels) {
        await prisma.notification.create({
          data: {
            userId: user.id,
            type: 'daily_digest',
            data: {
              today_todos: todayTodos.length,
              overdue_todos: overdueTodos.length,
              upcoming_rappels: upcomingRappels.length,
              summary: {
                today_todos: todayTodos,
                overdue_todos: overdueTodos,
                upcoming_rappels: upcomingRappels,
              },
            },
            link: '/dashboard',
          },
        });

        processed++;
      }
    }

    return Response.json({ processed });
  } catch (e: any) {
    console.error('GET /api/cron/daily-digest error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
