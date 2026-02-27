import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, authError } from '@/lib/auth';
import { formatRecord } from '@/lib/format';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim();

    if (!q || q.length === 0) {
      return Response.json({ clients: [], prospects: [], todos: [], users: [] });
    }

    const [clients, prospects, todos, users] = await Promise.all([
      prisma.client.findMany({
        where: {
          OR: [
            { societe: { contains: q, mode: 'insensitive' } },
            { gerant: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          societe: true,
          gerant: true,
          couleurStatut: true,
        },
        take: 10,
      }),
      prisma.prospect.findMany({
        where: {
          OR: [
            { societe: { contains: q, mode: 'insensitive' } },
            { contact: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          societe: true,
          contact: true,
          statut: true,
          couleurStatut: true,
        },
        take: 10,
      }),
      prisma.todo.findMany({
        where: {
          titre: { contains: q, mode: 'insensitive' },
        },
        select: {
          id: true,
          titre: true,
          statut: true,
          priorite: true,
          dateEcheance: true,
        },
        take: 10,
      }),
      prisma.user.findMany({
        where: {
          name: { contains: q, mode: 'insensitive' },
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          pole: true,
        },
        take: 10,
      }),
    ]);

    return Response.json({
      clients: clients.map(formatRecord),
      prospects: prospects.map(formatRecord),
      todos: todos.map(formatRecord),
      users: users.map(formatRecord),
    });
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    console.error('GET /api/search error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
