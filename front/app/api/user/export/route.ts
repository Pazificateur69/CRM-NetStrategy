import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, authError } from '@/lib/auth';
import { formatRecord } from '@/lib/format';

export async function GET(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);

    // Fetch user with all related data
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: {
        todos: {
          select: {
            id: true,
            titre: true,
            description: true,
            dateEcheance: true,
            statut: true,
            priorite: true,
            pole: true,
            createdAt: true,
          },
        },
        assignedTodos: {
          select: {
            id: true,
            titre: true,
            description: true,
            dateEcheance: true,
            statut: true,
            priorite: true,
            pole: true,
            createdAt: true,
          },
        },
        rappels: {
          select: {
            id: true,
            titre: true,
            description: true,
            dateRappel: true,
            fait: true,
            statut: true,
            priorite: true,
            createdAt: true,
          },
        },
        events: {
          select: {
            id: true,
            title: true,
            start: true,
            end: true,
            description: true,
            type: true,
            createdAt: true,
          },
        },
        contenu: {
          select: {
            id: true,
            type: true,
            pole: true,
            texte: true,
            nomOriginalFichier: true,
            createdAt: true,
          },
        },
        dailyMoods: {
          select: {
            id: true,
            mood: true,
            comment: true,
            date: true,
            createdAt: true,
          },
        },
        loginHistory: {
          select: {
            id: true,
            ipAddress: true,
            userAgent: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        notifications: {
          select: {
            id: true,
            type: true,
            data: true,
            link: true,
            readAt: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
      },
    });

    if (!user) {
      return authError('User not found', 404);
    }

    // Remove sensitive fields
    const { twoFactorSecret, twoFactorRecoveryCodes, supabaseId, ...safeUser } = user;

    const exportData = formatRecord({
      ...safeUser,
      exportedAt: new Date().toISOString(),
    });

    return new Response(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="user-data-export-${authUser.id}.json"`,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthenticated') {
      return authError();
    }
    console.error('User export error:', error);
    return Response.json(
      { message: 'An error occurred while exporting user data' },
      { status: 500 }
    );
  }
}
