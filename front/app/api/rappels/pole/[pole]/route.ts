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
  { params }: { params: Promise<{ pole: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { pole } = await params;

    const rappels = await prisma.rappel.findMany({
      where: { pole },
      include: rappelInclude,
      orderBy: [{ ordre: 'asc' }, { createdAt: 'desc' }],
    });

    return Response.json({ data: rappels.map(formatRappel) });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthenticated') {
      return authError();
    }
    console.error('GET /api/rappels/pole/[pole] error:', error);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
