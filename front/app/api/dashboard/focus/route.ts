import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, hasPermission, authError } from '@/lib/auth';
import { formatRecord } from '@/lib/format';

const todoInclude = {
  user: { select: { id: true, name: true, email: true } },
  assignedUser: { select: { id: true, name: true, email: true } },
  client: { select: { id: true, societe: true } },
  prospect: { select: { id: true, societe: true, contact: true } },
  project: { select: { id: true, title: true } },
};

const rappelInclude = {
  user: { select: { id: true, name: true } },
  assignedUsers: {
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  },
  client: { select: { id: true, societe: true } },
  prospect: { select: { id: true, societe: true } },
};

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const endOfTomorrow = new Date(tomorrow);
    endOfTomorrow.setDate(endOfTomorrow.getDate() + 1);

    // Build scope filter based on user role
    let scopeFilter: any = {};
    if (user.role === 'admin') {
      // Admin sees all
    } else if (hasPermission(user, 'edit todos')) {
      scopeFilter = { pole: user.pole };
    } else {
      scopeFilter = { OR: [{ userId: user.id }, { assignedTo: user.id }] };
    }

    const [overdueTodos, todayTodos, highPriority, upcomingRappels] = await Promise.all([
      prisma.todo.findMany({
        where: {
          ...scopeFilter,
          dateEcheance: { lt: today },
          statut: { not: 'termine' },
        },
        include: todoInclude,
        orderBy: { dateEcheance: 'asc' },
      }),
      prisma.todo.findMany({
        where: {
          ...scopeFilter,
          dateEcheance: {
            gte: today,
            lt: tomorrow,
          },
        },
        include: todoInclude,
        orderBy: { priorite: 'desc' },
      }),
      prisma.todo.findMany({
        where: {
          ...scopeFilter,
          priorite: 'haute',
          statut: { not: 'termine' },
        },
        include: todoInclude,
        orderBy: { dateEcheance: 'asc' },
      }),
      prisma.rappel.findMany({
        where: {
          dateRappel: { lte: endOfTomorrow },
          fait: false,
          ...(user.role === 'admin'
            ? {}
            : { assignedUsers: { some: { userId: user.id } } }),
        },
        include: rappelInclude,
        orderBy: { dateRappel: 'asc' },
      }),
    ]);

    // Format rappels to flatten assignedUsers
    const formatRappel = (r: any) => {
      const { assignedUsers, ...rest } = r;
      return formatRecord({
        ...rest,
        assignedUsers: assignedUsers?.map((ru: any) => ru.user) ?? [],
      });
    };

    return Response.json({
      overdue_todos: overdueTodos.map(formatRecord),
      today_todos: todayTodos.map(formatRecord),
      high_priority: highPriority.map(formatRecord),
      upcoming_rappels: upcomingRappels.map(formatRappel),
    });
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    console.error('GET /api/dashboard/focus error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
