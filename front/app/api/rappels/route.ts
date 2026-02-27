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

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    let where: any = {};

    if (user.role === 'admin') {
      // Admin sees all rappels
    } else if (hasPermission(user, 'edit rappels')) {
      // Users with 'edit rappels' permission see rappels in their pole
      where = { pole: user.pole };
    } else {
      // Otherwise only own rappels
      where = { userId: user.id };
    }

    const rappels = await prisma.rappel.findMany({
      where,
      include: rappelInclude,
      orderBy: [{ ordre: 'asc' }, { createdAt: 'desc' }],
    });

    return Response.json({ data: rappels.map(formatRappel) });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthenticated') {
      return authError();
    }
    console.error('GET /api/rappels error:', error);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();

    if (!body.titre || typeof body.titre !== 'string' || body.titre.trim() === '') {
      return Response.json({ message: 'Le titre est requis' }, { status: 422 });
    }

    const data: any = {
      titre: body.titre,
      description: body.description || null,
      fait: body.fait ?? false,
      statut: body.statut || 'planifie',
      ordre: body.ordre ?? 0,
      priorite: body.priorite || 'moyenne',
      pole: body.pole || user.pole,
      userId: user.id,
    };

    if (body.date_rappel) {
      data.dateRappel = new Date(body.date_rappel);
    }

    if (body.client_id) {
      data.clientId = Number(body.client_id);
    }

    if (body.prospect_id) {
      data.prospectId = Number(body.prospect_id);
    }

    const rappel = await prisma.rappel.create({
      data,
      include: rappelInclude,
    });

    // Create RappelUser entries for assigned users
    if (body.assigned_users && Array.isArray(body.assigned_users) && body.assigned_users.length > 0) {
      await prisma.rappelUser.createMany({
        data: body.assigned_users.map((uid: number) => ({
          rappelId: rappel.id,
          userId: Number(uid),
        })),
      });

      // Re-fetch with includes to get the assigned users
      const fullRappel = await prisma.rappel.findUnique({
        where: { id: rappel.id },
        include: rappelInclude,
      });

      await logAudit({
        userId: user.id,
        action: 'created',
        model: 'Rappel',
        modelId: rappel.id,
        newValues: { ...data, assigned_users: body.assigned_users },
      });

      return Response.json({ data: formatRappel(fullRappel) }, { status: 201 });
    }

    await logAudit({
      userId: user.id,
      action: 'created',
      model: 'Rappel',
      modelId: rappel.id,
      newValues: data,
    });

    return Response.json({ data: formatRappel(rappel) }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthenticated') {
      return authError();
    }
    console.error('POST /api/rappels error:', error);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
