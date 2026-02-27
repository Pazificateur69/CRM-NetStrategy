import { NextRequest } from 'next/server';
import { requireAuth, authError } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit';

export async function PUT(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);

    const body = await req.json();
    const { current_password, password, password_confirmation } = body;

    // Validate required fields
    if (!current_password || !password || !password_confirmation) {
      return Response.json(
        { message: 'Current password, new password, and password confirmation are required' },
        { status: 422 }
      );
    }

    // Check that password and confirmation match
    if (password !== password_confirmation) {
      return Response.json(
        { message: 'Password confirmation does not match' },
        { status: 422 }
      );
    }

    // Validate minimum password length
    if (password.length < 8) {
      return Response.json(
        { message: 'Password must be at least 8 characters' },
        { status: 422 }
      );
    }

    // Verify current password by attempting sign in
    const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: authUser.email,
      password: current_password,
    });

    if (signInError) {
      return Response.json(
        { message: 'Current password is incorrect' },
        { status: 422 }
      );
    }

    // Update password in Supabase
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      authUser.supabaseId,
      { password }
    );

    if (updateError) {
      return Response.json(
        { message: `Failed to update password: ${updateError.message}` },
        { status: 500 }
      );
    }

    // Log audit
    await logAudit({
      userId: authUser.id,
      action: 'password_changed',
      model: 'User',
      modelId: authUser.id,
    });

    return Response.json({ message: 'Password updated' });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthenticated') {
      return authError();
    }
    console.error('Update password error:', error);
    return Response.json(
      { message: 'An error occurred while updating password' },
      { status: 500 }
    );
  }
}
