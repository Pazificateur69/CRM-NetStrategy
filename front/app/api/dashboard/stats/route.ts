import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, authError } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);

    const [clients, prospects, todos, rappels] = await Promise.all([
      prisma.client.count(),
      prisma.prospect.count({
        where: { statut: { not: 'converti' } },
      }),
      prisma.todo.count({
        where: { statut: { not: 'termine' } },
      }),
      prisma.rappel.count({
        where: { fait: false },
      }),
    ]);

    return Response.json({ clients, prospects, todos, rappels });
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    console.error('GET /api/dashboard/stats error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
