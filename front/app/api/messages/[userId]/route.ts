import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, authError } from '@/lib/auth';
import { formatRecord } from '@/lib/format';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const currentUser = await requireAuth(req);
    const { userId } = await params;
    const otherUserId = parseInt(userId, 10);

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUser.id, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: currentUser.id },
        ],
      },
      include: {
        sender: { select: { id: true, name: true, email: true } },
        receiver: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Mark unread messages from the other user as read
    const unreadIds = messages
      .filter((m) => m.senderId === otherUserId && m.readAt === null)
      .map((m) => m.id);

    if (unreadIds.length > 0) {
      await prisma.message.updateMany({
        where: { id: { in: unreadIds } },
        data: { readAt: new Date() },
      });

      // Broadcast MessageRead event
      await supabaseAdmin
        .channel(`chat:${otherUserId}`)
        .send({
          type: 'broadcast',
          event: 'MessageRead',
          payload: { reader_id: currentUser.id, message_ids: unreadIds },
        });
    }

    return Response.json(messages.map(formatRecord));
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    console.error('GET /api/messages/[userId] error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const currentUser = await requireAuth(req);
    const { userId } = await params;
    const otherUserId = parseInt(userId, 10);

    await prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: currentUser.id,
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    return Response.json({ ok: true });
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    console.error('PUT /api/messages/[userId] error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
