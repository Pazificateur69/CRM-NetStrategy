import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, hasPermission, authError, forbiddenError } from '@/lib/auth';
import { formatResponse, formatRecord, toSnake, parseDecimal } from '@/lib/format';
import { logAudit } from '@/lib/audit';

const clientIncludes = {
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
  prestations: {
    include: {
      responsable: { select: { id: true, name: true } },
    },
  },
};

function formatRappel(rappel: any) {
  const { assignedUsers, ...rest } = rappel;
  return {
    ...rest,
    assignedUsers: assignedUsers?.map((ru: any) => ru.user) ?? [],
  };
}

function formatClient(client: any) {
  const formatted = {
    ...client,
    montantMensuelTotal: parseDecimal(client.montantMensuelTotal),
    rappels: client.rappels?.map(formatRappel) ?? [],
    prestations: client.prestations?.map((p: any) => ({
      ...p,
      tarifHt: parseDecimal(p.tarifHt),
    })) ?? [],
  };
  return formatted;
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    let clients;

    if (user.role === 'admin' || user.role === 'com' || user.role === 'comptabilite') {
      clients = await prisma.client.findMany({
        include: clientIncludes,
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // Other roles see clients where they have todos or prestations assigned
      clients = await prisma.client.findMany({
        where: {
          OR: [
            { todos: { some: { assignedTo: user.id } } },
            { prestations: { some: { assignedUserId: user.id } } },
          ],
        },
        include: clientIncludes,
        orderBy: { createdAt: 'desc' },
      });
    }

    const formatted = clients.map(formatClient);
    return Response.json(formatResponse(formatted));
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    console.error('GET /api/clients error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    if (!hasPermission(user, 'edit clients')) {
      return forbiddenError();
    }

    const body = await req.json();

    const client = await prisma.client.create({
      data: {
        societe: body.societe,
        gerant: body.gerant ?? null,
        siret: body.siret ?? null,
        siteWeb: body.site_web ?? body.siteWeb ?? null,
        adresse: body.adresse ?? null,
        ville: body.ville ?? null,
        codePostal: body.code_postal ?? body.codePostal ?? null,
        emails: body.emails ?? [],
        telephones: body.telephones ?? [],
        contrat: body.contrat ?? null,
        dateContrat: body.date_contrat ? new Date(body.date_contrat) : null,
        dateEcheance: body.date_echeance ? new Date(body.date_echeance) : null,
        montantMensuelTotal: body.montant_mensuel_total != null ? body.montant_mensuel_total : null,
        frequenceFacturation: body.frequence_facturation ?? body.frequenceFacturation ?? null,
        modePaiement: body.mode_paiement ?? body.modePaiement ?? null,
        iban: body.iban ?? null,
        descriptionGenerale: body.description_generale ?? body.descriptionGenerale ?? null,
        notesComptables: body.notes_comptables ?? body.notesComptables ?? null,
        liensExternes: body.liens_externes ?? body.liensExternes ?? null,
        interlocuteurs: body.interlocuteurs ?? null,
        couleurStatut: body.couleur_statut ?? body.couleurStatut ?? 'vert',
      },
      include: clientIncludes,
    });

    await logAudit({
      userId: user.id,
      action: 'create',
      model: 'Client',
      modelId: client.id,
      newValues: formatRecord(client),
    });

    return Response.json({ data: formatRecord(formatClient(client)) }, { status: 201 });
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    if (e.message === 'Forbidden') return forbiddenError();
    console.error('POST /api/clients error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
