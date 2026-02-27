import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, authError } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);

    const clients = await prisma.client.findMany({
      select: {
        id: true,
        societe: true,
        gerant: true,
        couleurStatut: true,
        todos: {
          where: { statut: 'retard' },
          select: { id: true },
        },
      },
      orderBy: { societe: 'asc' },
    });

    const prospects = await prisma.prospect.findMany({
      select: {
        id: true,
        societe: true,
        contact: true,
        couleurStatut: true,
        todos: {
          where: { statut: 'retard' },
          select: { id: true },
        },
      },
      orderBy: { societe: 'asc' },
    });

    return Response.json({
      clients: clients.map((c) => ({
        id: c.id,
        societe: c.societe,
        gerant: c.gerant,
        type: 'Client',
        couleur_statut: c.couleurStatut,
        todos_en_retard: c.todos.length,
        url_fiche: `/clients/${c.id}`,
      })),
      prospects: prospects.map((p) => ({
        id: p.id,
        societe: p.societe,
        contact: p.contact,
        type: 'Prospect',
        couleur_statut: p.couleurStatut,
        todos_en_retard: p.todos.length,
        url_fiche: `/prospects/${p.id}`,
      })),
    });
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    console.error('GET /api/dashboard/clients-overview error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
