import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, authError, getPoleFromRole } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit';

export async function PUT(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);

    const body = await req.json();
    const { name, email, bio } = body;

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (bio !== undefined) {
      // Store bio in dashboardPreferences or a separate field
      // Since there's no dedicated bio column, we store it in dashboardPreferences
      const currentUser = await prisma.user.findUnique({
        where: { id: authUser.id },
        select: { dashboardPreferences: true },
      });
      const currentPrefs = (currentUser?.dashboardPreferences as Record<string, unknown>) || {};
      updateData.dashboardPreferences = { ...currentPrefs, bio };
    }

    // Get old values for audit
    const oldUser = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { name: true, email: true },
    });

    // If email changed, update in Supabase auth as well
    if (email && email !== authUser.email) {
      const { error: supaError } = await supabaseAdmin.auth.admin.updateUserById(
        authUser.supabaseId,
        { email }
      );

      if (supaError) {
        return Response.json(
          { message: `Failed to update email: ${supaError.message}` },
          { status: 422 }
        );
      }
    }

    // Update user in prisma
    const updatedUser = await prisma.user.update({
      where: { id: authUser.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        pole: true,
        dashboardPreferences: true,
      },
    });

    // Log audit
    await logAudit({
      userId: authUser.id,
      action: 'update_profile',
      model: 'User',
      modelId: authUser.id,
      oldValues: oldUser,
      newValues: { name: updatedUser.name, email: updatedUser.email },
    });

    return Response.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      pole: updatedUser.pole || getPoleFromRole(updatedUser.role),
      bio: (updatedUser.dashboardPreferences as Record<string, unknown>)?.bio || null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthenticated') {
      return authError();
    }
    console.error('Update profile error:', error);
    return Response.json(
      { message: 'An error occurred while updating profile' },
      { status: 500 }
    );
  }
}
