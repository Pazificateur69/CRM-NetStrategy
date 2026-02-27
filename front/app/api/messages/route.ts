import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, authError } from '@/lib/auth';
import { formatRecord } from '@/lib/format';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const currentUser = await requireAuth(req);

    const formData = await req.formData();
    const receiverId = Number(formData.get('receiver_id'));
    const content = formData.get('content') as string | null;
    const imageFile = formData.get('image') as File | null;
    const audioFile = formData.get('audio') as File | null;

    if (!receiverId) {
      return Response.json({ message: 'receiver_id is required' }, { status: 422 });
    }

    let imageUrl: string | null = null;
    let audioUrl: string | null = null;

    // Upload image if provided
    if (imageFile) {
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileName = `images/${Date.now()}-${imageFile.name}`;

      const { data, error } = await supabaseAdmin.storage
        .from('chat-media')
        .upload(fileName, buffer, {
          contentType: imageFile.type,
        });

      if (error) {
        return Response.json({ message: 'Failed to upload image' }, { status: 500 });
      }

      const { data: urlData } = supabaseAdmin.storage
        .from('chat-media')
        .getPublicUrl(data.path);

      imageUrl = urlData.publicUrl;
    }

    // Upload audio if provided
    if (audioFile) {
      const bytes = await audioFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileName = `audio/${Date.now()}-${audioFile.name}`;

      const { data, error } = await supabaseAdmin.storage
        .from('chat-media')
        .upload(fileName, buffer, {
          contentType: audioFile.type,
        });

      if (error) {
        return Response.json({ message: 'Failed to upload audio' }, { status: 500 });
      }

      const { data: urlData } = supabaseAdmin.storage
        .from('chat-media')
        .getPublicUrl(data.path);

      audioUrl = urlData.publicUrl;
    }

    const message = await prisma.message.create({
      data: {
        senderId: currentUser.id,
        receiverId,
        content: content || null,
        imageUrl,
        audioUrl,
      },
      include: {
        sender: { select: { id: true, name: true, email: true } },
        receiver: { select: { id: true, name: true, email: true } },
      },
    });

    const formatted = formatRecord(message);

    // Broadcast via Supabase Realtime
    await supabaseAdmin
      .channel(`chat:${receiverId}`)
      .send({
        type: 'broadcast',
        event: 'MessageSent',
        payload: { message: formatted },
      });

    return Response.json(formatted, { status: 201 });
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    console.error('POST /api/messages error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
