import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, authError } from '@/lib/auth';
import { formatRecord } from '@/lib/format';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        pole: true,
      },
      orderBy: { name: 'asc' },
    });

    const poles = ['com', 'dev', 'seo', 'reseaux_sociaux', 'comptabilite', 'direction'];

    return Response.json({
      users: users.map(formatRecord),
      poles,
    });
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    console.error('GET /api/users/mentions error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
