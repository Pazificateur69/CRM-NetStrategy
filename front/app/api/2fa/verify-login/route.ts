import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getPoleFromRole } from '@/lib/auth';
import { verifySync } from 'otplib';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code } = body;

    if (!code) {
      return Response.json(
        { message: 'Code is required' },
        { status: 422 }
      );
    }

    // Get user from the auth token
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return Response.json(
        { message: 'Unauthenticated' },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    const { data: { user: supaUser }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !supaUser) {
      return Response.json(
        { message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { supabaseId: supaUser.id },
    });

    if (!user || !user.twoFactorSecret) {
      return Response.json(
        { message: 'Two-factor authentication is not configured' },
        { status: 422 }
      );
    }

    // First try TOTP verification
    let isValidTotp = false;
    try {
      isValidTotp = verifySync({ token: code, secret: user.twoFactorSecret });
    } catch {
      // verifySync can throw on malformed input
    }

    if (isValidTotp) {
      return Response.json({
        access_token: token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          pole: user.pole || getPoleFromRole(user.role),
        },
      });
    }

    // Try recovery codes
    if (user.twoFactorRecoveryCodes) {
      let recoveryCodes: string[];
      try {
        recoveryCodes = JSON.parse(user.twoFactorRecoveryCodes);
      } catch {
        recoveryCodes = [];
      }

      const codeIndex = recoveryCodes.indexOf(code);
      if (codeIndex !== -1) {
        // Remove the used recovery code
        recoveryCodes.splice(codeIndex, 1);

        await prisma.user.update({
          where: { id: user.id },
          data: {
            twoFactorRecoveryCodes: JSON.stringify(recoveryCodes),
          },
        });

        return Response.json({
          access_token: token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            pole: user.pole || getPoleFromRole(user.role),
          },
        });
      }
    }

    return Response.json(
      { message: 'Invalid two-factor authentication code' },
      { status: 422 }
    );
  } catch (error) {
    console.error('2FA verify-login error:', error);
    return Response.json(
      { message: 'An error occurred during verification' },
      { status: 500 }
    );
  }
}
