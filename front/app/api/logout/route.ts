import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);

      // Get the user from the token to find their supabaseId
      const { data: { user: supaUser } } = await supabaseAdmin.auth.getUser(token);

      if (supaUser) {
        // Look up user in prisma for audit logging
        const user = await prisma.user.findUnique({
          where: { supabaseId: supaUser.id },
        });

        // Sign out the user from Supabase
        await supabaseAdmin.auth.admin.signOut(supaUser.id).catch(() => {});

        if (user) {
          await logAudit({
            userId: user.id,
            action: 'logout',
            model: 'User',
            modelId: user.id,
          });
        }
      }
    }

    return Response.json({ message: 'Logged out' });
  } catch (error) {
    console.error('Logout error:', error);
    // Even if logout fails on the backend, we return success
    // so the client clears its token
    return Response.json({ message: 'Logged out' });
  }
}
