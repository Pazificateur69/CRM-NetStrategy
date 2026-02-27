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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find overdue todos
    const overdueTodos = await prisma.todo.findMany({
      where: {
        dateEcheance: { lt: today },
        statut: { not: 'termine' },
      },
      select: {
        id: true,
        titre: true,
        assignedTo: true,
        userId: true,
      },
    });

    // Update statut to 'retard'
    await prisma.todo.updateMany({
      where: {
        id: { in: overdueTodos.map((t) => t.id) },
      },
      data: { statut: 'retard' },
    });

    // Create notifications for assigned users
    const notifications = overdueTodos
      .filter((t) => t.assignedTo || t.userId)
      .map((t) => ({
        userId: t.assignedTo || t.userId!,
        type: 'todo_overdue',
        data: { todoId: t.id, titre: t.titre },
        link: `/todos`,
      }));

    if (notifications.length > 0) {
      await prisma.notification.createMany({
        data: notifications,
      });
    }

    return Response.json({ updated: overdueTodos.length });
  } catch (e: any) {
    console.error('GET /api/cron/check-overdue error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
