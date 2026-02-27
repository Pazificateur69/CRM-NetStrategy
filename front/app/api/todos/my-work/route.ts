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

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    const now = new Date();

    const todos = await prisma.todo.findMany({
      where: { assignedTo: user.id },
      include: todoInclude,
      orderBy: [{ ordre: 'asc' }, { createdAt: 'desc' }],
    });

    const columns: Record<string, any[]> = {
      retard: [],
      planifie: [],
      en_cours: [],
      termine: [],
    };

    for (const todo of todos) {
      const formatted = formatTodo(todo);

      if (todo.statut === 'termine') {
        columns.termine.push(formatted);
      } else if (todo.statut === 'en_cours') {
        columns.en_cours.push(formatted);
      } else if (
        todo.dateEcheance &&
        new Date(todo.dateEcheance) < now &&
        todo.statut !== 'termine'
      ) {
        columns.retard.push(formatted);
      } else {
        columns.planifie.push(formatted);
      }
    }

    return Response.json({ data: columns });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthenticated') {
      return authError();
    }
    console.error('GET /api/todos/my-work error:', error);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
