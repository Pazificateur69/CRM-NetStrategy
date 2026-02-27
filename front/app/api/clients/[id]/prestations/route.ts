import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, authError } from '@/lib/auth';
import { formatRecord, parseDecimal } from '@/lib/format';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;
    const clientId = parseInt(id, 10);

    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return Response.json({ message: 'Client not found' }, { status: 404 });
    }

    const body = await req.json();

    const prestation = await prisma.prestation.create({
      data: {
        type: body.type,
        tarifHt: body.tarif_ht ?? body.tarifHt ?? null,
        frequence: body.frequence ?? null,
        engagementMois: body.engagement_mois ?? body.engagementMois ?? null,
        dateDebut: body.date_debut ? new Date(body.date_debut) : null,
        dateFin: body.date_fin ? new Date(body.date_fin) : null,
        notes: body.notes ?? null,
        statut: body.statut ?? 'en_attente',
        clientId,
        assignedUserId: body.assigned_user_id ?? body.assignedUserId ?? null,
      },
      include: {
        responsable: { select: { id: true, name: true } },
      },
    });

    const formatted = {
      ...prestation,
      tarifHt: parseDecimal(prestation.tarifHt),
    };

    return Response.json({ data: formatRecord(formatted) }, { status: 201 });
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    console.error('POST /api/clients/[id]/prestations error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
