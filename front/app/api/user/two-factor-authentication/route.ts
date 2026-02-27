import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, authError } from '@/lib/auth';
import { generateSecret, generateURI } from 'otplib';
import QRCode from 'qrcode';

export async function POST(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);

    // Generate a new TOTP secret
    const secret = generateSecret();

    // Save the secret to the user (not yet confirmed)
    await prisma.user.update({
      where: { id: authUser.id },
      data: { twoFactorSecret: secret },
    });

    // Generate the otpauth URL
    const appName = process.env.APP_NAME || 'CRM NetStrategy';
    const otpauthUrl = generateURI(appName, authUser.email, secret);

    // Generate QR code as data URL
    const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

    return Response.json({
      secret,
      qr_code_url: qrCodeUrl,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthenticated') {
      return authError();
    }
    console.error('2FA setup error:', error);
    return Response.json(
      { message: 'An error occurred while setting up two-factor authentication' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);

    // Clear all 2FA fields
    await prisma.user.update({
      where: { id: authUser.id },
      data: {
        twoFactorSecret: null,
        twoFactorConfirmedAt: null,
        twoFactorRecoveryCodes: null,
      },
    });

    return Response.json({ message: 'Two-factor authentication disabled' });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthenticated') {
      return authError();
    }
    console.error('2FA disable error:', error);
    return Response.json(
      { message: 'An error occurred while disabling two-factor authentication' },
      { status: 500 }
    );
  }
}
