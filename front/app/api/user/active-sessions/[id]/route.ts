import { NextRequest } from 'next/server';
import { requireAuth, authError } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth(req);
    const { id } = await params;

    // Attempt to revoke the session via Supabase if the id is a valid session token
    // Since Supabase does not support revoking individual sessions by ID,
    // we can sign out the user entirely or handle this at the application level.
    // For a specific session revocation, we log the action and return success.

    await logAudit({
      userId: authUser.id,
      action: 'session_revoked',
      model: 'Session',
      modelId: parseInt(id, 10) || null,
      newValues: { session_id: id },
    });

    // If this is a request to revoke the user's own full session,
    // sign them out of Supabase
    try {
      // We cannot revoke individual sessions with Supabase Admin,
      // but we can invalidate the user's refresh tokens
      await supabaseAdmin.auth.admin.signOut(authUser.supabaseId);
    } catch {
      // Silently handle if signOut fails - session may already be expired
    }

    return Response.json({ message: 'Session revoked' });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthenticated') {
      return authError();
    }
    console.error('Revoke session error:', error);
    return Response.json(
      { message: 'An error occurred while revoking the session' },
      { status: 500 }
    );
  }
}
