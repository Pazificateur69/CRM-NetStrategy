import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit';
import { loginSchema } from '@/lib/validation/schemas';
import { getPoleFromRole } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { message: 'Validation error', errors: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { email, password } = parsed.data;

    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.session) {
      return Response.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Look up user in prisma by supabaseId
    const user = await prisma.user.findUnique({
      where: { supabaseId: authData.user.id },
    });

    if (!user) {
      return Response.json(
        { message: 'User not found in system' },
        { status: 401 }
      );
    }

    // Log login history
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        ipAddress,
        userAgent,
        status: 'success',
        details: { method: 'password' },
      },
    }).catch(() => {});

    // Log audit
    await logAudit({
      userId: user.id,
      action: 'login',
      model: 'User',
      modelId: user.id,
    });

    // Check if 2FA is enabled
    if (user.twoFactorConfirmedAt) {
      return Response.json({
        two_factor: true,
        temp_token: authData.session.access_token,
      });
    }

    // Return full auth response
    return Response.json({
      access_token: authData.session.access_token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        pole: user.pole || getPoleFromRole(user.role),
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return Response.json(
      { message: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
