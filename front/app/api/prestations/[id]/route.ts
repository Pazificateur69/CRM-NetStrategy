import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, authError } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

const prestationIncludes = {
  client: { select: { id: true, societe: true } },
  responsable: { select: { id: true, name: true } },
};

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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;

    const prestation = await prisma.prestation.findUnique({
      where: { id: Number(id) },
      include: prestationIncludes,
    });

    if (!prestation) {
      return Response.json({ message: 'Prestation not found' }, { status: 404 });
    }

    return Response.json({ data: formatPrestation(prestation) });
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    console.error('GET /api/prestations/[id] error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
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

    const body = await req.json();

    const data: any = {};
    if (body.type !== undefined) data.type = body.type;
    if (body.tarif_ht !== undefined) data.tarifHt = body.tarif_ht;
    if (body.frequence !== undefined) data.frequence = body.frequence;
    if (body.engagement_mois !== undefined) data.engagementMois = body.engagement_mois;
    if (body.date_debut !== undefined) data.dateDebut = body.date_debut ? new Date(body.date_debut) : null;
    if (body.date_fin !== undefined) data.dateFin = body.date_fin ? new Date(body.date_fin) : null;
    if (body.notes !== undefined) data.notes = body.notes;
    if (body.statut !== undefined) data.statut = body.statut;
    if (body.client_id !== undefined) data.clientId = body.client_id;
    if (body.assigned_user_id !== undefined) data.assignedUserId = body.assigned_user_id;

    const updated = await prisma.prestation.update({
      where: { id: prestationId },
      data,
      include: prestationIncludes,
    });

    await logAudit({
      userId: user.id,
      action: 'update',
      model: 'Prestation',
      modelId: prestationId,
      oldValues: { statut: existing.statut },
      newValues: { statut: updated.statut },
    });

    return Response.json({ data: formatPrestation(updated) });
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    console.error('PUT /api/prestations/[id] error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
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

    await prisma.prestation.delete({
      where: { id: prestationId },
    });

    await logAudit({
      userId: user.id,
      action: 'delete',
      model: 'Prestation',
      modelId: prestationId,
    });

    return Response.json({ message: 'Prestation deleted' });
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    console.error('DELETE /api/prestations/[id] error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
