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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;

    const rappel = await prisma.rappel.findUnique({
      where: { id: Number(id) },
      include: rappelInclude,
    });

    if (!rappel) {
      return Response.json({ message: 'Rappel not found' }, { status: 404 });
    }

    return Response.json({ data: formatRappel(rappel) });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthenticated') {
      return authError();
    }
    console.error('GET /api/rappels/[id] error:', error);
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
    const body = await req.json();

    const existing = await prisma.rappel.findUnique({
      where: { id: Number(id) },
      include: rappelInclude,
    });

    if (!existing) {
      return Response.json({ message: 'Rappel not found' }, { status: 404 });
    }

    const oldValues = toSnake(existing);

    const data: any = {};

    if (body.titre !== undefined) data.titre = body.titre;
    if (body.description !== undefined) data.description = body.description;
    if (body.date_rappel !== undefined) {
      data.dateRappel = body.date_rappel ? new Date(body.date_rappel) : null;
    }
    if (body.fait !== undefined) data.fait = body.fait;
    if (body.statut !== undefined) data.statut = body.statut;
    if (body.ordre !== undefined) data.ordre = body.ordre;
    if (body.priorite !== undefined) data.priorite = body.priorite;
    if (body.pole !== undefined) data.pole = body.pole;
    if (body.client_id !== undefined) {
      data.clientId = body.client_id ? Number(body.client_id) : null;
    }
    if (body.prospect_id !== undefined) {
      data.prospectId = body.prospect_id ? Number(body.prospect_id) : null;
    }

    const rappel = await prisma.rappel.update({
      where: { id: Number(id) },
      data,
    });

    // Handle assigned_users update
    if (body.assigned_users !== undefined && Array.isArray(body.assigned_users)) {
      // Delete existing entries
      await prisma.rappelUser.deleteMany({
        where: { rappelId: Number(id) },
      });

      // Recreate entries
      if (body.assigned_users.length > 0) {
        await prisma.rappelUser.createMany({
          data: body.assigned_users.map((uid: number) => ({
            rappelId: Number(id),
            userId: Number(uid),
          })),
        });
      }
    }

    // Re-fetch with full includes
    const fullRappel = await prisma.rappel.findUnique({
      where: { id: Number(id) },
      include: rappelInclude,
    });

    await logAudit({
      userId: user.id,
      action: 'updated',
      model: 'Rappel',
      modelId: Number(id),
      oldValues,
      newValues: data,
    });

    return Response.json({ data: formatRappel(fullRappel) });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthenticated') {
      return authError();
    }
    console.error('PUT /api/rappels/[id] error:', error);
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

    const existing = await prisma.rappel.findUnique({
      where: { id: Number(id) },
    });

    if (!existing) {
      return Response.json({ message: 'Rappel not found' }, { status: 404 });
    }

    // Delete RappelUser entries first
    await prisma.rappelUser.deleteMany({
      where: { rappelId: Number(id) },
    });

    // Delete the rappel
    await prisma.rappel.delete({ where: { id: Number(id) } });

    await logAudit({
      userId: user.id,
      action: 'deleted',
      model: 'Rappel',
      modelId: Number(id),
      oldValues: toSnake(existing),
    });

    return Response.json({ message: 'Rappel deleted' });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthenticated') {
      return authError();
    }
    console.error('DELETE /api/rappels/[id] error:', error);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
