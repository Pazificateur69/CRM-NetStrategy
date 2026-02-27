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
      .download(contenu.cheminFichier);

    if (error || !data) {
      console.error('Supabase download error:', error);
      return Response.json({ message: 'File download failed' }, { status: 500 });
    }

    const arrayBuffer = await data.arrayBuffer();
    const fileName = contenu.nomOriginalFichier || 'download';

    // Determine content type from file extension
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const mimeTypes: Record<string, string> = {
      pdf: 'application/pdf',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      csv: 'text/csv',
      txt: 'text/plain',
      zip: 'application/zip',
      mp4: 'video/mp4',
      mp3: 'audio/mpeg',
    };
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    return new Response(arrayBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
        'Content-Length': String(arrayBuffer.byteLength),
      },
    });
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    console.error('GET /api/contenu/[id]/download error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
