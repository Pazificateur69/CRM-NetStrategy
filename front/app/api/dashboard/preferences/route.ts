import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, authError } from '@/lib/auth';

export async function PUT(req: NextRequest) {
  try {
    const currentUser = await requireAuth(req);

    const body = await req.json();
    const { preferences } = body;

    if (!preferences || typeof preferences !== 'object') {
      return Response.json({ message: 'preferences object is required' }, { status: 422 });
    }

    const updated = await prisma.user.update({
      where: { id: currentUser.id },
      data: { dashboardPreferences: preferences },
      select: { dashboardPreferences: true },
    });

    return Response.json({ preferences: updated.dashboardPreferences });
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    console.error('PUT /api/dashboard/preferences error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
