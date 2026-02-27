import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, authError } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;
    const prestationId = Number(id);

    const existing = await prisma.prestation.findUnique({
      where: { id: prestationId },
    });

    if (!existing) {
      return Response.json({ message: 'Prestation not found' }, { status: 404 });
    }

    const updated = await prisma.prestation.update({
      where: { id: prestationId },
      data: { statut: 'validee' },
      include: {
        client: { select: { id: true, societe: true } },
        responsable: { select: { id: true, name: true } },
      },
    });

    await logAudit({
      userId: user.id,
      action: 'update',
      model: 'Prestation',
      modelId: prestationId,
      oldValues: { statut: existing.statut },
      newValues: { statut: 'validee' },
    });

    return Response.json({ data: formatPrestation(updated) });
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    console.error('POST /api/prestations/[id]/validate error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
