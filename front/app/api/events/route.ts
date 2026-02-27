import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, authError } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { eventSchema } from '@/lib/validation/schemas';

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

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    const { searchParams } = new URL(req.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    const where: any = {};

    // Date range filtering
    if (start || end) {
      where.start = {};
      if (start) where.start.gte = new Date(start);
      if (end) where.start.lte = new Date(end);
    }

    // Non-admin users only see their own events
    if (user.role !== 'admin') {
      where.userId = user.id;
    }

    const events = await prisma.event.findMany({
      where,
      include: eventIncludes,
      orderBy: { start: 'asc' },
    });

    return Response.json({ data: events.map(formatEvent) });
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    console.error('GET /api/events error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();

    const parsed = eventSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { message: 'Validation error', errors: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const data = parsed.data;

    const event = await prisma.event.create({
      data: {
        title: data.title,
        start: new Date(data.start),
        end: data.end ? new Date(data.end) : null,
        description: data.description ?? null,
        type: data.type,
        userId: user.id,
        clientId: data.client_id ?? null,
        prospectId: data.prospect_id ?? null,
      },
      include: eventIncludes,
    });

    await logAudit({
      userId: user.id,
      action: 'create',
      model: 'Event',
      modelId: event.id,
      newValues: { title: event.title, type: event.type },
    });

    return Response.json({ data: formatEvent(event) }, { status: 201 });
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    console.error('POST /api/events error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
