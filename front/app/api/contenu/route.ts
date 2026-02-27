import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, authError } from '@/lib/auth';
import { formatRecord } from '@/lib/format';
import { logAudit } from '@/lib/audit';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    const contentType = req.headers.get('content-type') || '';
    let contenu;

    if (contentType.includes('multipart/form-data')) {
      // File upload
      const formData = await req.formData();
      const fichier = formData.get('fichier') as File | null;
      const type = (formData.get('type') as string) || 'Fichier';
      const clientId = formData.get('client_id') ? Number(formData.get('client_id')) : null;
      const prospectId = formData.get('prospect_id') ? Number(formData.get('prospect_id')) : null;
      const pole = (formData.get('pole') as string) || null;
      const prestationId = formData.get('prestation_id') ? Number(formData.get('prestation_id')) : null;

      if (!fichier) {
        return Response.json({ message: 'No file provided' }, { status: 400 });
      }

      const buffer = Buffer.from(await fichier.arrayBuffer());
      const timestamp = Date.now();
      const safeName = fichier.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${user.id}/${timestamp}_${safeName}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from('contenus')
        .upload(path, buffer, {
          contentType: fichier.type,
          upsert: false,
        });

      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        return Response.json({ message: 'File upload failed' }, { status: 500 });
      }

      contenu = await prisma.contenuFiche.create({
        data: {
          type,
          cheminFichier: path,
          nomOriginalFichier: fichier.name,
          clientId,
          prospectId,
          pole,
          prestationId,
          userId: user.id,
        },
        include: {
          user: { select: { id: true, name: true } },
        },
      });
    } else {
      // Comment or NoteCommerciale
      const body = await req.json();
      const { type, texte, client_id, prospect_id, pole, prestation_id } = body;

      if (!type || !texte) {
        return Response.json({ message: 'type and texte are required' }, { status: 400 });
      }

      contenu = await prisma.contenuFiche.create({
        data: {
          type,
          texte,
          clientId: client_id ? Number(client_id) : null,
          prospectId: prospect_id ? Number(prospect_id) : null,
          pole: pole || null,
          prestationId: prestation_id ? Number(prestation_id) : null,
          userId: user.id,
        },
        include: {
          user: { select: { id: true, name: true } },
        },
      });

      // Handle @mentions in texte
      const mentionPattern = /@(\w+)/g;
      const mentions = texte.match(mentionPattern);

      if (mentions && mentions.length > 0) {
        const usernames = mentions.map((m: string) => m.slice(1));
        const snippet = texte.length > 100 ? texte.substring(0, 100) + '...' : texte;

        // Find mentioned users by name or pole
        const mentionedUsers = await prisma.user.findMany({
          where: {
            OR: [
              { name: { in: usernames } },
              { pole: { in: usernames } },
            ],
          },
        });

        // Determine link based on context
        let link = '/';
        if (client_id) link = `/clients/${client_id}`;
        else if (prospect_id) link = `/prospects/${prospect_id}`;

        // Create notifications for mentioned users
        for (const mentionedUser of mentionedUsers) {
          if (mentionedUser.id === user.id) continue; // Don't notify self
          await prisma.notification.create({
            data: {
              userId: mentionedUser.id,
              type: 'mention',
              data: { text: snippet, mentionedBy: user.name },
              link,
            },
          });
        }
      }
    }

    await logAudit({
      userId: user.id,
      action: 'create',
      model: 'ContenuFiche',
      modelId: contenu.id,
      newValues: { type: contenu.type },
    });

    return Response.json({ data: formatRecord(contenu) }, { status: 201 });
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    console.error('POST /api/contenu error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
