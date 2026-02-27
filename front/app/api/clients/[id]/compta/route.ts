import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, authError } from '@/lib/auth';
import { formatRecord, parseDecimal } from '@/lib/format';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;

    const client = await prisma.client.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        prestations: {
          include: {
            responsable: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!client) {
      return Response.json({ message: 'Client not found' }, { status: 404 });
    }

    const montantMensuel = parseDecimal(client.montantMensuelTotal) ?? 0;
    const totalAnnuel = montantMensuel * 12;

    const prestations = client.prestations.map((p) => ({
      ...p,
      tarifHt: parseDecimal(p.tarifHt),
    }));

    return Response.json({
      client: formatRecord(client),
      prestations: prestations.map(formatRecord),
      montant_mensuel_total: montantMensuel,
      total_annuel: totalAnnuel,
    });
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    console.error('GET /api/clients/[id]/compta error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
