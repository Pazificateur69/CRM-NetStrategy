import { NextRequest } from 'next/server';
import { requireAuth, authError } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const currentUser = await requireAuth(req);

    const body = await req.json();
    const receiverId = body.receiver_id;

    if (!receiverId) {
      return Response.json({ message: 'receiver_id is required' }, { status: 422 });
    }

    await supabaseAdmin
      .channel(`chat:${receiverId}`)
      .send({
        type: 'broadcast',
        event: 'UserTyping',
        payload: { sender_id: currentUser.id },
      });

    return Response.json({ ok: true });
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    console.error('POST /api/messages/typing error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
