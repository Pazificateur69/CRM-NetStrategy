import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, authError } from '@/lib/auth';
import { formatResponse, formatRecord } from '@/lib/format';
import { logAudit } from '@/lib/audit';

const prospectIncludes = {
  todos: {
    include: {
      user: { select: { id: true, name: true } },
      assignedUser: { select: { id: true, name: true, email: true } },
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

function formatProspect(prospect: any) {
  return {
    ...prospect,
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

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);

    const prospects = await prisma.prospect.findMany({
      include: prospectIncludes,
      orderBy: { createdAt: 'desc' },
    });

    const formatted = prospects.map(formatProspect);
    return Response.json(formatResponse(formatted));
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    console.error('GET /api/prospects error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();

    const score = calculateScore({
      emails: body.emails,
      telephones: body.telephones,
      contact: body.contact,
      societe: body.societe,
    });

    const prospect = await prisma.prospect.create({
      data: {
        societe: body.societe,
        contact: body.contact ?? null,
        emails: body.emails ?? [],
        telephones: body.telephones ?? [],
        statut: body.statut ?? 'en_attente',
        score,
        scoreDetails: body.score_details ?? body.scoreDetails ?? null,
        couleurStatut: body.couleur_statut ?? body.couleurStatut ?? 'vert',
        adresse: body.adresse ?? null,
        ville: body.ville ?? null,
        codePostal: body.code_postal ?? body.codePostal ?? null,
        siteWeb: body.site_web ?? body.siteWeb ?? null,
      },
      include: prospectIncludes,
    });

    await logAudit({
      userId: user.id,
      action: 'create',
      model: 'Prospect',
      modelId: prospect.id,
      newValues: formatRecord(prospect),
    });

    return Response.json({ data: formatRecord(formatProspect(prospect)) }, { status: 201 });
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    console.error('POST /api/prospects error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
