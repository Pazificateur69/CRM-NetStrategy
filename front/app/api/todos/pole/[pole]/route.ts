import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, hasPermission, authError, forbiddenError, AuthUser } from '@/lib/auth';
import { formatResponse, formatRecord, toSnake } from '@/lib/format';
import { logAudit } from '@/lib/audit';

const todoInclude = {
  user: { select: { id: true, name: true, email: true } },
  assignedUser: { select: { id: true, name: true, email: true } },
  client: { select: { id: true, societe: true } },
  prospect: { select: { id: true, societe: true, contact: true } },
  project: { select: { id: true, title: true } },
};

function formatTodo(t: any) {
  return {
    id: t.id,
    titre: t.titre,
    description: t.description,
    date_echeance: t.dateEcheance,
    statut: t.statut,
    ordre: t.ordre,
    priorite: t.priorite,
    pole: t.pole,
    review_status: t.reviewStatus,
    review_comment: t.reviewComment,
    user_id: t.userId,
    client_id: t.clientId,
    prospect_id: t.prospectId,
    assigned_to: t.assignedTo,
    project_id: t.projectId,
    created_at: t.createdAt,
    updated_at: t.updatedAt,
    user: t.user,
    assigned_user: t.assignedUser,
    client: t.client,
    todoable: t.prospect
      ? { id: t.prospect.id, societe: t.prospect.societe, contact: t.prospect.contact, type: 'Prospect' }
      : null,
    project: t.project,
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ pole: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { pole } = await params;

    // Admin can view any pole, others can only view their own pole
    if (user.role !== 'admin' && user.pole !== pole) {
      return forbiddenError('You can only view todos for your own pole');
    }

    const url = new URL(req.url);
    const statut = url.searchParams.get('statut');
    const priorite = url.searchParams.get('priorite');

    const where: any = { pole };
    if (statut) where.statut = statut;
    if (priorite) where.priorite = priorite;

    const todos = await prisma.todo.findMany({
      where,
      include: todoInclude,
      orderBy: [{ ordre: 'asc' }, { createdAt: 'desc' }],
    });

    return Response.json({ data: todos.map(formatTodo) });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthenticated') {
      return authError();
    }
    console.error('GET /api/todos/pole/[pole] error:', error);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
