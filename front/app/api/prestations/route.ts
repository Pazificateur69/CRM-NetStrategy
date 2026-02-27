import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, authError } from '@/lib/auth';

function formatPrestation(p: any) {
  return {
    id: p.id,
    client_id: p.clientId,
    type: p.type,
    tarif_ht: p.tarifHt ? Number(p.tarifHt) : null,
    frequence: p.frequence,
    engagement_mois: p.engagementMois,
    date_debut: p.dateDebut,
    date_fin: p.dateFin,
    notes: p.notes,
    statut: p.statut,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
    client: p.client ? { id: p.client.id, societe: p.client.societe } : null,
    responsable: p.responsable ? { id: p.responsable.id, name: p.responsable.name } : null,
  };
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    const prestations = await prisma.prestation.findMany({
      include: {
        client: { select: { id: true, societe: true } },
        responsable: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return Response.json({ data: prestations.map(formatPrestation) });
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    console.error('GET /api/prestations error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
