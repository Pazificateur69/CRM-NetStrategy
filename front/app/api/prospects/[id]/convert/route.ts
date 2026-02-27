import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, authError } from '@/lib/auth';
import { formatRecord } from '@/lib/format';
import { logAudit } from '@/lib/audit';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;
    const prospectId = parseInt(id, 10);

    const prospect = await prisma.prospect.findUnique({
      where: { id: prospectId },
      include: {
        todos: true,
        rappels: {
          include: { assignedUsers: true },
        },
        contenu: true,
        events: true,
      },
    });

    if (!prospect) {
      return Response.json({ message: 'Prospect not found' }, { status: 404 });
    }

    if (prospect.statut === 'converti') {
      return Response.json({ message: 'Prospect already converted' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create new client from prospect data
      const newClient = await tx.client.create({
        data: {
          societe: prospect.societe,
          emails: prospect.emails,
          telephones: prospect.telephones,
          adresse: prospect.adresse,
          ville: prospect.ville,
          codePostal: prospect.codePostal,
          siteWeb: prospect.siteWeb,
        },
      });

      // 2. Reassign todos: set clientId, clear prospectId
      if (prospect.todos.length > 0) {
        await tx.todo.updateMany({
          where: { prospectId: prospect.id },
          data: {
            clientId: newClient.id,
            prospectId: null,
          },
        });
      }

      // 3. Reassign rappels: set clientId, clear prospectId
      if (prospect.rappels.length > 0) {
        await tx.rappel.updateMany({
          where: { prospectId: prospect.id },
          data: {
            clientId: newClient.id,
            prospectId: null,
          },
        });
      }

      // 4. Reassign contenu: set clientId, clear prospectId
      if (prospect.contenu.length > 0) {
        await tx.contenuFiche.updateMany({
          where: { prospectId: prospect.id },
          data: {
            clientId: newClient.id,
            prospectId: null,
          },
        });
      }

      // 5. Create a default prestation for the new client
      await tx.prestation.create({
        data: {
          type: 'Dev',
          statut: 'en_attente',
          clientId: newClient.id,
        },
      });

      // 6. Update prospect statut to 'converti'
      await tx.prospect.update({
        where: { id: prospect.id },
        data: { statut: 'converti' },
      });

      return newClient;
    });

    await logAudit({
      userId: user.id,
      action: 'convert',
      model: 'Prospect',
      modelId: prospectId,
      oldValues: formatRecord(prospect),
      newValues: { client_id: result.id, client_societe: result.societe },
    });

    return Response.json({
      message: 'Prospect converti en client',
      client_id: result.id,
      client_societe: result.societe,
    });
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    console.error('POST /api/prospects/[id]/convert error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
