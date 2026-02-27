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

    let where: any = {};

    if (user.role === 'admin') {
      // Admin sees all todos
    } else if (hasPermission(user, 'edit todos')) {
      // Users with 'edit todos' permission see todos in their pole
      where = { pole: user.pole };
    } else {
      // Otherwise only own todos
      where = { userId: user.id };
    }

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
    console.error('GET /api/todos error:', error);
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
      statut: body.statut || 'planifie',
      ordre: body.ordre ?? 0,
      priorite: body.priorite || 'moyenne',
      pole: body.pole || user.pole,
      reviewStatus: body.review_status || 'none',
      reviewComment: body.review_comment || null,
      userId: user.id,
    };

    if (body.date_echeance) {
      data.dateEcheance = new Date(body.date_echeance);
    }

    if (body.assigned_to) {
      data.assignedTo = Number(body.assigned_to);
    }

    if (body.client_id) {
      data.clientId = Number(body.client_id);
    }

    if (body.prospect_id) {
      data.prospectId = Number(body.prospect_id);
    }

    if (body.project_id) {
      data.projectId = Number(body.project_id);
    }

    const todo = await prisma.todo.create({
      data,
      include: todoInclude,
    });

    await logAudit({
      userId: user.id,
      action: 'created',
      model: 'Todo',
      modelId: todo.id,
      newValues: data,
    });

    return Response.json({ data: formatTodo(todo) }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthenticated') {
      return authError();
    }
    console.error('POST /api/todos error:', error);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
