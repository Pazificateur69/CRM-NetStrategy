import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, authError, forbiddenError } from '@/lib/auth';
import { formatRecord } from '@/lib/format';

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, 'admin');

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const perPage = 20;
    const skip = (page - 1) * perPage;

    const [total, logs] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.findMany({
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
      }),
    ]);

    const lastPage = Math.ceil(total / perPage);

    return Response.json({
      data: logs.map(formatRecord),
      meta: {
        current_page: page,
        last_page: lastPage,
        total,
      },
    });
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    if (e.message === 'Forbidden') return forbiddenError();
    console.error('GET /api/audit-logs error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
