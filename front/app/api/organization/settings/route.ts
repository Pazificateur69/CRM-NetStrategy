import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole, authError, forbiddenError } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);

    const settings = await prisma.organizationSetting.findMany();

    const result: Record<string, string> = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }

    return Response.json(result);
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    console.error('GET /api/organization/settings error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireRole(req, 'admin');

    const body = await req.json();
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return Response.json({ message: 'settings object is required' }, { status: 422 });
    }

    const entries = Object.entries(settings) as [string, string][];

    await Promise.all(
      entries.map(([key, value]) =>
        prisma.organizationSetting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        })
      )
    );

    // Return updated settings
    const allSettings = await prisma.organizationSetting.findMany();
    const result: Record<string, string> = {};
    for (const s of allSettings) {
      result[s.key] = s.value;
    }

    return Response.json(result);
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    if (e.message === 'Forbidden') return forbiddenError();
    console.error('PUT /api/organization/settings error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
