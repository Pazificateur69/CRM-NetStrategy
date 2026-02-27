import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, authError } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

const eventIncludes = {
  user: { select: { id: true, name: true } },
  client: { select: { id: true, societe: true } },
  prospect: { select: { id: true, societe: true } },
};

function formatEvent(e: any) {
  return {
    id: e.id,
    title: e.title,
    start: e.start,
    end: e.end,
    description: e.description,
    type: e.type,
    user_id: e.userId,
    client_id: e.clientId,
    prospect_id: e.prospectId,
    created_at: e.createdAt,
    updated_at: e.updatedAt,
    user: e.user,
    client: e.client ? { id: e.client.id, societe: e.client.societe } : null,
    prospect: e.prospect ? { id: e.prospect.id, societe: e.prospect.societe } : null,
  };
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;
    const eventId = Number(id);

    const existing = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!existing) {
      return Response.json({ message: 'Event not found' }, { status: 404 });
    }

    const body = await req.json();

    const data: any = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.start !== undefined) data.start = new Date(body.start);
    if (body.end !== undefined) data.end = body.end ? new Date(body.end) : null;
    if (body.description !== undefined) data.description = body.description;
    if (body.type !== undefined) data.type = body.type;
    if (body.client_id !== undefined) data.clientId = body.client_id;
    if (body.prospect_id !== undefined) data.prospectId = body.prospect_id;

    const updated = await prisma.event.update({
      where: { id: eventId },
      data,
      include: eventIncludes,
    });

    await logAudit({
      userId: user.id,
      action: 'update',
      model: 'Event',
      modelId: eventId,
      oldValues: { title: existing.title },
      newValues: { title: updated.title },
    });

    return Response.json({ data: formatEvent(updated) });
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    console.error('PUT /api/events/[id] error:', e);
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
    const eventId = Number(id);

    const existing = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!existing) {
      return Response.json({ message: 'Event not found' }, { status: 404 });
    }

    await prisma.event.delete({
      where: { id: eventId },
    });

    await logAudit({
      userId: user.id,
      action: 'delete',
      model: 'Event',
      modelId: eventId,
    });

    return Response.json({ message: 'Event deleted' });
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    console.error('DELETE /api/events/[id] error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
