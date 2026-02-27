import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, hasPermission, authError, forbiddenError, AuthUser } from '@/lib/auth';
import { formatResponse, formatRecord, toSnake } from '@/lib/format';
import { logAudit } from '@/lib/audit';

const rappelInclude = {
  user: { select: { id: true, name: true, email: true } },
  client: { select: { id: true, societe: true } },
  prospect: { select: { id: true, societe: true, contact: true } },
  assignedUsers: { include: { user: { select: { id: true, name: true, email: true } } } },
};

function formatRappel(r: any) {
  return {
    id: r.id,
    titre: r.titre,
    description: r.description,
    date_rappel: r.dateRappel,
    fait: r.fait,
    statut: r.statut,
    ordre: r.ordre,
    priorite: r.priorite,
    pole: r.pole,
    user_id: r.userId,
    client_id: r.clientId,
    prospect_id: r.prospectId,
    created_at: r.createdAt,
    updated_at: r.updatedAt,
    user: r.user,
    client: r.client,
    rappelable: r.prospect
      ? { id: r.prospect.id, societe: r.prospect.societe, contact: r.prospect.contact, type: 'Prospect' }
      : null,
    assigned_users: r.assignedUsers?.map((ru: any) => ru.user) || [],
  };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;
    const body = await req.json();

    if (!body.jours || typeof body.jours !== 'number') {
      return Response.json({ message: 'Le champ jours est requis et doit etre un nombre' }, { status: 422 });
    }

    const rappel = await prisma.rappel.findUnique({
      where: { id: Number(id) },
      include: rappelInclude,
    });

    if (!rappel) {
      return Response.json({ message: 'Rappel not found' }, { status: 404 });
    }

    const oldDate = rappel.dateRappel;
    const baseDate = oldDate ? new Date(oldDate) : new Date();
    baseDate.setDate(baseDate.getDate() + body.jours);

    const updated = await prisma.rappel.update({
      where: { id: Number(id) },
      data: { dateRappel: baseDate },
      include: rappelInclude,
    });

    await logAudit({
      userId: user.id,
      action: 'updated',
      model: 'Rappel',
      modelId: Number(id),
      oldValues: { date_rappel: oldDate },
      newValues: { date_rappel: baseDate },
    });

    return Response.json({ data: formatRappel(updated) });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthenticated') {
      return authError();
    }
    console.error('POST /api/rappels/[id]/decaler error:', error);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
