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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;

    const todo = await prisma.todo.findUnique({
      where: { id: Number(id) },
      include: todoInclude,
    });

    if (!todo) {
      return Response.json({ message: 'Todo not found' }, { status: 404 });
    }

    return Response.json({ data: formatTodo(todo) });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthenticated') {
      return authError();
    }
    console.error('GET /api/todos/[id] error:', error);
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

    const existing = await prisma.todo.findUnique({
      where: { id: Number(id) },
    });

    if (!existing) {
      return Response.json({ message: 'Todo not found' }, { status: 404 });
    }

    // Permission check: admin can edit all, creator can edit own, assigned user can update status
    const isAdmin = user.role === 'admin';
    const isCreator = existing.userId === user.id;
    const isAssigned = existing.assignedTo === user.id;

    if (!isAdmin && !isCreator && !isAssigned) {
      return forbiddenError('You do not have permission to edit this todo');
    }

    // If assigned user (not admin/creator), only allow status updates
    if (isAssigned && !isAdmin && !isCreator) {
      const allowedFields = ['statut', 'review_status', 'review_comment'];
      const bodyKeys = Object.keys(body);
      const hasDisallowed = bodyKeys.some((k) => !allowedFields.includes(k));
      if (hasDisallowed) {
        return forbiddenError('Assigned users can only update status fields');
      }
    }

    const oldValues = toSnake(existing);

    const data: any = {};

    if (body.titre !== undefined) data.titre = body.titre;
    if (body.description !== undefined) data.description = body.description;
    if (body.date_echeance !== undefined) {
      data.dateEcheance = body.date_echeance ? new Date(body.date_echeance) : null;
    }
    if (body.statut !== undefined) data.statut = body.statut;
    if (body.ordre !== undefined) data.ordre = body.ordre;
    if (body.priorite !== undefined) data.priorite = body.priorite;
    if (body.pole !== undefined) data.pole = body.pole;
    if (body.review_status !== undefined) data.reviewStatus = body.review_status;
    if (body.review_comment !== undefined) data.reviewComment = body.review_comment;
    if (body.assigned_to !== undefined) {
      data.assignedTo = body.assigned_to ? Number(body.assigned_to) : null;
    }
    if (body.client_id !== undefined) {
      data.clientId = body.client_id ? Number(body.client_id) : null;
    }
    if (body.prospect_id !== undefined) {
      data.prospectId = body.prospect_id ? Number(body.prospect_id) : null;
    }
    if (body.project_id !== undefined) {
      data.projectId = body.project_id ? Number(body.project_id) : null;
    }

    const todo = await prisma.todo.update({
      where: { id: Number(id) },
      data,
      include: todoInclude,
    });

    await logAudit({
      userId: user.id,
      action: 'updated',
      model: 'Todo',
      modelId: todo.id,
      oldValues,
      newValues: data,
    });

    return Response.json({ data: formatTodo(todo) });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthenticated') {
      return authError();
    }
    console.error('PUT /api/todos/[id] error:', error);
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

    const existing = await prisma.todo.findUnique({
      where: { id: Number(id) },
    });

    if (!existing) {
      return Response.json({ message: 'Todo not found' }, { status: 404 });
    }

    // Permission check: admin or creator only
    if (user.role !== 'admin' && existing.userId !== user.id) {
      return forbiddenError('You do not have permission to delete this todo');
    }

    await prisma.todo.delete({ where: { id: Number(id) } });

    await logAudit({
      userId: user.id,
      action: 'deleted',
      model: 'Todo',
      modelId: Number(id),
      oldValues: toSnake(existing),
    });

    return Response.json({ message: 'Todo deleted' });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthenticated') {
      return authError();
    }
    console.error('DELETE /api/todos/[id] error:', error);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
