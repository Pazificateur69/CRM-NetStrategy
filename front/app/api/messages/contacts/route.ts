import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, authError } from '@/lib/auth';
import { formatRecord } from '@/lib/format';

export async function GET(req: NextRequest) {
  try {
    const currentUser = await requireAuth(req);

    const users = await prisma.user.findMany({
      where: { id: { not: currentUser.id } },
      select: {
        id: true,
        name: true,
        email: true,
        lastSeenAt: true,
      },
      orderBy: { name: 'asc' },
    });

    const contacts = await Promise.all(
      users.map(async (user) => {
        const [lastMessage, unreadCount] = await Promise.all([
          prisma.message.findFirst({
            where: {
              OR: [
                { senderId: currentUser.id, receiverId: user.id },
                { senderId: user.id, receiverId: currentUser.id },
              ],
            },
            orderBy: { createdAt: 'desc' },
            select: { content: true, createdAt: true },
          }),
          prisma.message.count({
            where: {
              senderId: user.id,
              receiverId: currentUser.id,
              readAt: null,
            },
          }),
        ]);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          unread_count: unreadCount,
          last_message: lastMessage?.content || null,
          last_message_time: lastMessage?.createdAt || null,
          last_seen_at: user.lastSeenAt,
        };
      })
    );

    // Sort by last_message_time descending (contacts with messages first)
    contacts.sort((a, b) => {
      if (!a.last_message_time && !b.last_message_time) return 0;
      if (!a.last_message_time) return 1;
      if (!b.last_message_time) return -1;
      return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime();
    });

    return Response.json(contacts);
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    console.error('GET /api/messages/contacts error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
