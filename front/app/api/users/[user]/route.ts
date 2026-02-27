import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole, authError, forbiddenError, getPoleFromRole } from '@/lib/auth';
import { formatRecord } from '@/lib/format';
import { supabaseAdmin } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ user: string }> }
) {
  try {
    await requireAuth(req);
    const { user: userId } = await params;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId, 10) },
    });

    if (!user) {
      return Response.json({ message: 'User not found' }, { status: 404 });
    }

    return Response.json({ user: formatRecord(user) });
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    console.error('GET /api/users/[user] error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ user: string }> }
) {
  try {
    const currentUser = await requireRole(req, 'admin');
    const { user: userId } = await params;
    const id = parseInt(userId, 10);

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ message: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const data: any = {};

    if (body.name !== undefined) data.name = body.name;
    if (body.email !== undefined) data.email = body.email;
    if (body.role !== undefined) {
      data.role = body.role;
      data.pole = getPoleFromRole(body.role);
    }

    // Update Supabase Auth if email or password changed
    const supaUpdates: any = {};
    if (body.email !== undefined && body.email !== existing.email) {
      supaUpdates.email = body.email;
    }
    if (body.password) {
      supaUpdates.password = body.password;
    }

    if (Object.keys(supaUpdates).length > 0) {
      const { error: supaError } = await supabaseAdmin.auth.admin.updateUserById(
        existing.supabaseId,
        supaUpdates
      );
      if (supaError) {
        return Response.json({ message: supaError.message }, { status: 400 });
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
    });

    await logAudit({
      userId: currentUser.id,
      action: 'update',
      model: 'User',
      modelId: id,
      oldValues: formatRecord(existing),
      newValues: formatRecord(updated),
    });

    return Response.json({ user: formatRecord(updated) });
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    if (e.message === 'Forbidden') return forbiddenError();
    console.error('PUT /api/users/[user] error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ user: string }> }
) {
  try {
    const currentUser = await requireRole(req, 'admin');
    const { user: userId } = await params;
    const id = parseInt(userId, 10);

    if (id === currentUser.id) {
      return Response.json({ message: 'Cannot delete yourself' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ message: 'User not found' }, { status: 404 });
    }

    await prisma.user.delete({ where: { id } });

    await supabaseAdmin.auth.admin.deleteUser(existing.supabaseId);

    await logAudit({
      userId: currentUser.id,
      action: 'delete',
      model: 'User',
      modelId: id,
      oldValues: formatRecord(existing),
    });

    return Response.json({ message: 'User deleted' });
  } catch (e: any) {
    if (e.message === 'Unauthenticated') return authError();
    if (e.message === 'Forbidden') return forbiddenError();
    console.error('DELETE /api/users/[user] error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
