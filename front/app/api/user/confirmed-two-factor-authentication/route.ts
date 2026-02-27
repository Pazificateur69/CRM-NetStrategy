import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, authError } from '@/lib/auth';
import { verifySync } from 'otplib';
import crypto from 'crypto';

function generateRecoveryCodes(count: number = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    codes.push(crypto.randomBytes(8).toString('hex'));
  }
  return codes;
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);

    const body = await req.json();
    const { code } = body;

    if (!code) {
      return Response.json(
        { message: 'Verification code is required' },
        { status: 422 }
      );
    }

    // Get user with 2FA secret
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { twoFactorSecret: true },
    });

    if (!user?.twoFactorSecret) {
      return Response.json(
        { message: 'Two-factor authentication has not been set up yet' },
        { status: 422 }
      );
    }

    // Verify the TOTP code
    const isValid = verifySync({ token: code, secret: user.twoFactorSecret });

    if (!isValid) {
      return Response.json(
        { message: 'Invalid verification code' },
        { status: 422 }
      );
    }

    // Generate recovery codes
    const recoveryCodes = generateRecoveryCodes(8);

    // Confirm 2FA and save recovery codes
    await prisma.user.update({
      where: { id: authUser.id },
      data: {
        twoFactorConfirmedAt: new Date(),
        twoFactorRecoveryCodes: JSON.stringify(recoveryCodes),
      },
    });

    return Response.json({
      message: 'Two-factor authentication confirmed',
      recovery_codes: recoveryCodes,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthenticated') {
      return authError();
    }
    console.error('2FA confirm error:', error);
    return Response.json(
      { message: 'An error occurred while confirming two-factor authentication' },
      { status: 500 }
    );
  }
}
