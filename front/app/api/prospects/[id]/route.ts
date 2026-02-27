import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, authError } from '@/lib/auth';
import { formatRecord } from '@/lib/format';
import { logAudit } from '@/lib/audit';

const prospectIncludes = {
  todos: {
    include: {
      user: { select: { id: true, name: true } },
      assignedUser: { select: { id: true, name: true, email: true } },
      client: { select: { id: true, societe: true } },
    },
  },
  rappels: {
    include: {
      user: { select: { id: true, name: true } },
      assignedUsers: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  },
  contenu: {
    include: {
      user: { select: { id: true, name: true } },
    },
  },
  events: true,
};

function formatRappel(rappel: any) {
  const { assignedUsers, ...rest } = rappel;
  return {
    ...rest,
    assignedUsers: assignedUsers?.map((ru: any) => ru.user) ?? [],
  };
}

function formatTodo(todo: any) {
  return {
    id: todo.id,
    titre: todo.titre,
    description: todo.description,
    statut: todo.statut,
    priorite: todo.priorite,
    dateEcheance: todo.dateEcheance,
    ordre: todo.ordre,
    pole: todo.pole,
    reviewStatus: todo.reviewStatus,
    reviewComment: todo.reviewComment,
    user: todo.user,
    assignedUser: todo.assignedUser,
    client: todo.client,
    createdAt: todo.createdAt,
    updatedAt: todo.updatedAt,
  };
}

function formatProspect(prospect: any) {
  return {
    ...prospect,
    todos: prospect.todos?.map(formatTodo) ?? [],
    rappels: prospect.rappels?.map(formatRappel) ?? [],
  };
}

function calculateScore(data: {
  emails?: any;
  telephones?: any;
  contact?: string | null;
  societe?: string;
}): number {
  let score = 0;

  const emails = Array.isArray(data.emails) ? data.emails : [];
  const telephones = Array.isArray(data.telephones) ? data.telephones : [];

  if (emails.length > 0 && emails[0]) score += 20;
  if (telephones.length > 0 && telephones[0]) score += 20;
  if (data.contact) score += 10;
  if (data.societe) score += 10;

  return score;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(req);
    const { id } = await params;

    const prospect = await prisma.prospect.findUnique({
      where: { id: parseInt(id, 10) },
      include: prospectIncludes,
    });

    if (!prospect) {
      return Response.json({ message: 'Prospect not found' }, { status: 404 });
    }

    return Response.json({ data: formatRecord(formatProspect(prospect)) });
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    console.error('GET /api/prospects/[id] error:', e);
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
    const prospectId = parseInt(id, 10);

    const existing = await prisma.prospect.findUnique({
      where: { id: prospectId },
    });

    if (!existing) {
      return Response.json({ message: 'Prospect not found' }, { status: 404 });
    }

    const body = await req.json();

    const data: any = {};

    if (body.societe !== undefined) data.societe = body.societe;
    if (body.contact !== undefined) data.contact = body.contact;
    if (body.emails !== undefined) data.emails = body.emails;
    if (body.telephones !== undefined) data.telephones = body.telephones;
    if (body.statut !== undefined) data.statut = body.statut;
    if (body.score_details !== undefined || body.scoreDetails !== undefined) {
      data.scoreDetails = body.score_details ?? body.scoreDetails;
    }
    if (body.couleur_statut !== undefined || body.couleurStatut !== undefined) {
      data.couleurStatut = body.couleur_statut ?? body.couleurStatut;
    }
    if (body.adresse !== undefined) data.adresse = body.adresse;
    if (body.ville !== undefined) data.ville = body.ville;
    if (body.code_postal !== undefined || body.codePostal !== undefined) {
      data.codePostal = body.code_postal ?? body.codePostal;
    }
    if (body.site_web !== undefined || body.siteWeb !== undefined) {
      data.siteWeb = body.site_web ?? body.siteWeb;
    }

    // Recalculate score based on merged data
    const mergedEmails = data.emails ?? existing.emails;
    const mergedTelephones = data.telephones ?? existing.telephones;
    const mergedContact = data.contact !== undefined ? data.contact : existing.contact;
    const mergedSociete = data.societe ?? existing.societe;

    data.score = calculateScore({
      emails: mergedEmails,
      telephones: mergedTelephones,
      contact: mergedContact,
      societe: mergedSociete,
    });

    const updated = await prisma.prospect.update({
      where: { id: prospectId },
      data,
      include: prospectIncludes,
    });

    await logAudit({
      userId: user.id,
      action: 'update',
      model: 'Prospect',
      modelId: prospectId,
      oldValues: formatRecord(existing),
      newValues: formatRecord(updated),
    });

    return Response.json({ data: formatRecord(formatProspect(updated)) });
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    console.error('PUT /api/prospects/[id] error:', e);
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
    const prospectId = parseInt(id, 10);

    const existing = await prisma.prospect.findUnique({
      where: { id: prospectId },
    });

    if (!existing) {
      return Response.json({ message: 'Prospect not found' }, { status: 404 });
    }

    await prisma.prospect.delete({
      where: { id: prospectId },
    });

    await logAudit({
      userId: user.id,
      action: 'delete',
      model: 'Prospect',
      modelId: prospectId,
      oldValues: formatRecord(existing),
    });

    return Response.json({ message: 'Prospect deleted' });
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    console.error('DELETE /api/prospects/[id] error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
