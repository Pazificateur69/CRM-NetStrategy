import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, authError, forbiddenError } from '@/lib/auth';
import { formatRecord } from '@/lib/format';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ pole: string }> }
) {
  try {
    await requireRole(req, 'admin');
    const { pole } = await params;

    const users = await prisma.user.findMany({
      where: { pole },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        pole: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: 'asc' },
    });

    return Response.json({ data: users.map(formatRecord) });
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    if (e.message === 'Forbidden') return forbiddenError();
    console.error('GET /api/users/by-pole/[pole] error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
