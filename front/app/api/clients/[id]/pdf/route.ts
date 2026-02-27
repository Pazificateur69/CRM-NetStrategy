import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, authError, forbiddenError } from '@/lib/auth';
import { formatRecord, parseDecimal } from '@/lib/format';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);

    if (user.role !== 'admin') {
      return forbiddenError('Only admins can generate client PDFs');
    }

    const { id } = await params;

    const client = await prisma.client.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        todos: {
          include: {
            user: { select: { id: true, name: true } },
            assignedUser: { select: { id: true, name: true, email: true } },
          },
        },
        rappels: {
          include: {
            user: { select: { id: true, name: true } },
            assignedUsers: {
              include: {
                user: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
        contenu: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
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

    // Format rappels to flatten assignedUsers
    const formattedRappels = client.rappels.map((r) => {
      const { assignedUsers, ...rest } = r;
      return {
        ...rest,
        assignedUsers: assignedUsers?.map((ru) => ru.user) ?? [],
      };
    });

    // Format prestations decimals
    const formattedPrestations = client.prestations.map((p) => ({
      ...p,
      tarifHt: parseDecimal(p.tarifHt),
    }));

    const formatted = {
      ...client,
      montantMensuelTotal: parseDecimal(client.montantMensuelTotal),
      rappels: formattedRappels,
      prestations: formattedPrestations,
    };

    return Response.json({ data: formatRecord(formatted) });
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    console.error('GET /api/clients/[id]/pdf error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
