import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, authError } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

const projectDetailIncludes = {
  client: { select: { id: true, societe: true, gerant: true } },
  manager: { select: { id: true, name: true } },
  tasks: {
    include: {
      user: { select: { id: true, name: true } },
      assignedUser: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'asc' as const },
  },
};

function formatProject(p: any) {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    status: p.status,
    start_date: p.startDate,
    due_date: p.dueDate,
    budget: p.budget ? Number(p.budget) : null,
    progress: p.progress,
    client_id: p.clientId,
    user_id: p.userId,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
    client: p.client ? { id: p.client.id, societe: p.client.societe, gerant: p.client.gerant } : null,
    manager: p.manager ? { id: p.manager.id, name: p.manager.name } : null,
    tasks_count: p.tasks?.length ?? p._count?.tasks ?? 0,
    tasks: p.tasks,
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id: Number(id) },
      include: projectDetailIncludes,
    });

    if (!project) {
      return Response.json({ message: 'Project not found' }, { status: 404 });
    }

    return Response.json({ data: formatProject(project) });
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    console.error('GET /api/projects/[id] error:', e);
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
    const projectId = Number(id);

    const existing = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!existing) {
      return Response.json({ message: 'Project not found' }, { status: 404 });
    }

    const body = await req.json();

    const data: any = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.description !== undefined) data.description = body.description;
    if (body.status !== undefined) data.status = body.status;
    if (body.start_date !== undefined) data.startDate = body.start_date ? new Date(body.start_date) : null;
    if (body.due_date !== undefined) data.dueDate = body.due_date ? new Date(body.due_date) : null;
    if (body.client_id !== undefined) data.clientId = body.client_id;
    if (body.budget !== undefined) data.budget = body.budget;
    if (body.progress !== undefined) data.progress = body.progress;

    const updated = await prisma.project.update({
      where: { id: projectId },
      data,
      include: projectDetailIncludes,
    });

    await logAudit({
      userId: user.id,
      action: 'update',
      model: 'Project',
      modelId: projectId,
      oldValues: { status: existing.status, title: existing.title },
      newValues: { status: updated.status, title: updated.title },
    });

    return Response.json({ data: formatProject(updated) });
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    console.error('PUT /api/projects/[id] error:', e);
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
    const projectId = Number(id);

    const existing = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!existing) {
      return Response.json({ message: 'Project not found' }, { status: 404 });
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    await logAudit({
      userId: user.id,
      action: 'delete',
      model: 'Project',
      modelId: projectId,
    });

    return Response.json({ message: 'Project deleted' });
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    console.error('DELETE /api/projects/[id] error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
