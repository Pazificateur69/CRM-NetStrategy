import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, authError } from '@/lib/auth';
import { formatRecord } from '@/lib/format';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ client: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { client } = await params;
    const clientId = Number(client);

    const { searchParams } = new URL(req.url);
    const prospectId = searchParams.get('prospect_id');

    const where: any = {};

    if (prospectId) {
      // Get contenu for both the client and the linked prospect
      where.OR = [
        { clientId },
        { prospectId: Number(prospectId) },
      ];
    } else {
      where.clientId = clientId;
    }

    const contenu = await prisma.contenuFiche.findMany({
      where,
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return Response.json({ data: contenu.map(formatRecord) });
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    console.error('GET /api/contenu/client/[client] error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
