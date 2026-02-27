import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, authError, forbiddenError } from '@/lib/auth';
import { formatRecord } from '@/lib/format';

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, 'admin');

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        role: true,
        pole: true,
      },
      orderBy: { name: 'asc' },
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const result = await Promise.all(
      users.map(async (user) => {
        const [activeTodos, completedTodos, activeRappels] = await Promise.all([
          prisma.todo.count({
            where: {
              assignedTo: user.id,
              statut: { not: 'termine' },
            },
          }),
          prisma.todo.count({
            where: {
              assignedTo: user.id,
              statut: 'termine',
              updatedAt: {
                gte: startOfMonth,
                lte: endOfMonth,
              },
            },
          }),
          prisma.rappel.count({
            where: {
              assignedUsers: { some: { userId: user.id } },
              fait: false,
            },
          }),
        ]);

        return {
          id: user.id,
          name: user.name,
          role: user.role,
          pole: user.pole,
          active_todos: activeTodos,
          completed_todos: completedTodos,
          active_rappels: activeRappels,
        };
      })
    );

    return Response.json(result);
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    if (e.message === 'Forbidden') return forbiddenError();
    console.error('GET /api/users/workload error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
