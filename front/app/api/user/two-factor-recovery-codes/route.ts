import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, authError } from '@/lib/auth';
import crypto from 'crypto';

function generateRecoveryCodes(count: number = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    codes.push(crypto.randomBytes(8).toString('hex'));
  }
  return codes;
}

export async function GET(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { twoFactorRecoveryCodes: true },
    });

    if (!user?.twoFactorRecoveryCodes) {
      return Response.json([]);
    }

    let codes: string[];
    try {
      codes = JSON.parse(user.twoFactorRecoveryCodes);
    } catch {
      codes = [];
    }

    return Response.json(codes);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthenticated') {
      return authError();
    }
    console.error('Get recovery codes error:', error);
    return Response.json(
      { message: 'An error occurred while fetching recovery codes' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);

    // Generate 8 new recovery codes
    const recoveryCodes = generateRecoveryCodes(8);

    await prisma.user.update({
      where: { id: authUser.id },
      data: {
        twoFactorRecoveryCodes: JSON.stringify(recoveryCodes),
      },
    });

    return Response.json(recoveryCodes);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthenticated') {
      return authError();
    }
    console.error('Regenerate recovery codes error:', error);
    return Response.json(
      { message: 'An error occurred while generating recovery codes' },
      { status: 500 }
    );
  }
}
