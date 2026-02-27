import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, authError } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit';

export async function DELETE(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);

    const body = await req.json();
    const { password } = body;

    if (!password) {
      return Response.json(
        { message: 'Password is required to delete account' },
        { status: 422 }
      );
    }

    // Verify the password by attempting sign in
    const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: authUser.email,
      password,
    });

    if (signInError) {
      return Response.json(
        { message: 'Password is incorrect' },
        { status: 422 }
      );
    }

    // Log audit before deletion
    await logAudit({
      userId: authUser.id,
      action: 'account_deleted',
      model: 'User',
      modelId: authUser.id,
      oldValues: { name: authUser.name, email: authUser.email, role: authUser.role },
    });

    // Delete user from prisma first
    await prisma.user.delete({
      where: { id: authUser.id },
    });

    // Delete user from Supabase auth
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
      authUser.supabaseId
    );

    if (deleteError) {
      console.error('Failed to delete user from Supabase:', deleteError);
      // User is already deleted from prisma, so we still return success
    }

    return Response.json({ message: 'Account deleted' });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthenticated') {
      return authError();
    }
    console.error('Delete account error:', error);
    return Response.json(
      { message: 'An error occurred while deleting account' },
      { status: 500 }
    );
  }
}
