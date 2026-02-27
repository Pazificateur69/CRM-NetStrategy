import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole, authError, forbiddenError, getPoleFromRole } from '@/lib/auth';
import { formatRecord } from '@/lib/format';
import { supabaseAdmin } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit';

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
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return Response.json(users.map(formatRecord));
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    console.error('GET /api/users error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await requireRole(req, 'admin');

    const body = await req.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password) {
      return Response.json({ message: 'Name, email and password are required' }, { status: 422 });
    }

    // Create user in Supabase Auth
    const { data: supaData, error: supaError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (supaError || !supaData.user) {
      return Response.json({ message: supaError?.message || 'Failed to create auth user' }, { status: 400 });
    }

    const pole = getPoleFromRole(role || 'com');

    const user = await prisma.user.create({
      data: {
        supabaseId: supaData.user.id,
        name,
        email,
        role: role || 'com',
        pole,
      },
    });

    await logAudit({
      userId: currentUser.id,
      action: 'create',
      model: 'User',
      modelId: user.id,
      newValues: formatRecord(user),
    });

    return Response.json({ user: formatRecord(user) }, { status: 201 });
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    if (e.message === 'Forbidden') return forbiddenError();
    console.error('POST /api/users error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
