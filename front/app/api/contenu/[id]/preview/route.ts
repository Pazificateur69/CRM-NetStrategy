import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, authError } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;
    const contenuId = Number(id);

    const contenu = await prisma.contenuFiche.findUnique({
      where: { id: contenuId },
    });

    if (!contenu) {
      return Response.json({ message: 'Contenu not found' }, { status: 404 });
    }

    if (!contenu.cheminFichier) {
      return Response.json({ message: 'No file associated with this contenu' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.storage
      .from('contenus')
      .createSignedUrl(contenu.cheminFichier, 3600);

    if (error || !data) {
      console.error('Supabase signed URL error:', error);
      return Response.json({ message: 'Could not generate preview URL' }, { status: 500 });
    }

    return Response.json({ url: data.signedUrl });
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    console.error('GET /api/contenu/[id]/preview error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
