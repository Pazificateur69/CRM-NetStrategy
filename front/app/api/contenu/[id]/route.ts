import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, authError } from '@/lib/auth';
import { formatRecord } from '@/lib/format';
import { logAudit } from '@/lib/audit';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;
    const contenuId = Number(id);

    const body = await req.json();

    const existing = await prisma.contenuFiche.findUnique({
      where: { id: contenuId },
    });

    if (!existing) {
      return Response.json({ message: 'Contenu not found' }, { status: 404 });
    }

    const updated = await prisma.contenuFiche.update({
      where: { id: contenuId },
      data: { texte: body.texte },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    await logAudit({
      userId: user.id,
      action: 'update',
      model: 'ContenuFiche',
      modelId: contenuId,
      oldValues: { texte: existing.texte },
      newValues: { texte: body.texte },
    });

    return Response.json({ data: formatRecord(updated) });
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    console.error('PUT /api/contenu/[id] error:', e);
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
    const contenuId = Number(id);

    const existing = await prisma.contenuFiche.findUnique({
      where: { id: contenuId },
    });

    if (!existing) {
      return Response.json({ message: 'Contenu not found' }, { status: 404 });
    }

    // If it's a file, delete from Supabase Storage
    if (existing.type === 'Fichier' && existing.cheminFichier) {
      const { error: deleteError } = await supabaseAdmin.storage
        .from('contenus')
        .remove([existing.cheminFichier]);

      if (deleteError) {
        console.error('Supabase storage delete error:', deleteError);
      }
    }

    await prisma.contenuFiche.delete({
      where: { id: contenuId },
    });

    await logAudit({
      userId: user.id,
      action: 'delete',
      model: 'ContenuFiche',
      modelId: contenuId,
      oldValues: formatRecord(existing),
    });

    return Response.json({ message: 'Deleted' });
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    console.error('DELETE /api/contenu/[id] error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
