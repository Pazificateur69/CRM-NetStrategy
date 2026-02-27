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

function formatClient(client: any) {
  return {
    ...client,
    montantMensuelTotal: parseDecimal(client.montantMensuelTotal),
    todos: client.todos?.map(formatTodo) ?? [],
    rappels: client.rappels?.map(formatRappel) ?? [],
    prestations: client.prestations?.map((p: any) => ({
      ...p,
      tarifHt: parseDecimal(p.tarifHt),
    })) ?? [],
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;

    const client = await prisma.client.findUnique({
      where: { id: parseInt(id, 10) },
      include: clientIncludes,
    });

    if (!client) {
      return Response.json({ message: 'Client not found' }, { status: 404 });
    }

    return Response.json({ data: formatRecord(formatClient(client)) });
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    console.error('GET /api/clients/[id] error:', e);
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
    const clientId = parseInt(id, 10);

    const existing = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!existing) {
      return Response.json({ message: 'Client not found' }, { status: 404 });
    }

    const body = await req.json();

    const data: any = {};

    if (body.societe !== undefined) data.societe = body.societe;
    if (body.gerant !== undefined) data.gerant = body.gerant;
    if (body.siret !== undefined) data.siret = body.siret;
    if (body.site_web !== undefined || body.siteWeb !== undefined) data.siteWeb = body.site_web ?? body.siteWeb;
    if (body.adresse !== undefined) data.adresse = body.adresse;
    if (body.ville !== undefined) data.ville = body.ville;
    if (body.code_postal !== undefined || body.codePostal !== undefined) data.codePostal = body.code_postal ?? body.codePostal;
    if (body.emails !== undefined) data.emails = body.emails;
    if (body.telephones !== undefined) data.telephones = body.telephones;
    if (body.contrat !== undefined) data.contrat = body.contrat;
    if (body.date_contrat !== undefined) data.dateContrat = body.date_contrat ? new Date(body.date_contrat) : null;
    if (body.date_echeance !== undefined) data.dateEcheance = body.date_echeance ? new Date(body.date_echeance) : null;
    if (body.montant_mensuel_total !== undefined) data.montantMensuelTotal = body.montant_mensuel_total;
    if (body.frequence_facturation !== undefined || body.frequenceFacturation !== undefined) {
      data.frequenceFacturation = body.frequence_facturation ?? body.frequenceFacturation;
    }
    if (body.mode_paiement !== undefined || body.modePaiement !== undefined) {
      data.modePaiement = body.mode_paiement ?? body.modePaiement;
    }
    if (body.iban !== undefined) data.iban = body.iban;
    if (body.description_generale !== undefined || body.descriptionGenerale !== undefined) {
      data.descriptionGenerale = body.description_generale ?? body.descriptionGenerale;
    }
    if (body.notes_comptables !== undefined || body.notesComptables !== undefined) {
      data.notesComptables = body.notes_comptables ?? body.notesComptables;
    }
    if (body.liens_externes !== undefined || body.liensExternes !== undefined) {
      data.liensExternes = body.liens_externes ?? body.liensExternes;
    }
    if (body.interlocuteurs !== undefined) data.interlocuteurs = body.interlocuteurs;
    if (body.couleur_statut !== undefined || body.couleurStatut !== undefined) {
      data.couleurStatut = body.couleur_statut ?? body.couleurStatut;
    }

    const updated = await prisma.client.update({
      where: { id: clientId },
      data,
      include: clientIncludes,
    });

    await logAudit({
      userId: user.id,
      action: 'update',
      model: 'Client',
      modelId: clientId,
      oldValues: formatRecord(existing),
      newValues: formatRecord(updated),
    });

    return Response.json({ data: formatRecord(formatClient(updated)) });
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    console.error('PUT /api/clients/[id] error:', e);
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
    const clientId = parseInt(id, 10);

    if (user.role !== 'admin') {
      return forbiddenError('Only admins can delete clients');
    }

    const existing = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!existing) {
      return Response.json({ message: 'Client not found' }, { status: 404 });
    }

    await prisma.client.delete({
      where: { id: clientId },
    });

    await logAudit({
      userId: user.id,
      action: 'delete',
      model: 'Client',
      modelId: clientId,
      oldValues: formatRecord(existing),
    });

    return Response.json({ message: 'Client deleted' });
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    console.error('DELETE /api/clients/[id] error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
