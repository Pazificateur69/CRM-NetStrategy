import { NextRequest } from 'next/server';
import { prisma } from './prisma';
import { supabaseAdmin } from './supabase/server';

export interface AuthUser {
  id: number;
  supabaseId: string;
  name: string;
  email: string;
  role: string;
  pole: string | null;
}

const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ['*'],
  com: ['view clients', 'edit clients', 'view prospects', 'edit prospects', 'view todos', 'edit todos', 'view rappels', 'edit rappels'],
  comptabilite: ['view clients'],
  dev: ['view clients', 'view todos', 'edit todos'],
  seo: ['view clients', 'view todos', 'edit todos'],
  reseaux_sociaux: ['view clients', 'view todos', 'edit todos'],
  rh: ['view clients', 'view todos'],
};

function getPoleFromRole(role: string): string {
  const map: Record<string, string> = {
    admin: 'direction',
    com: 'com',
    comptabilite: 'comptabilite',
    dev: 'dev',
    seo: 'seo',
    reseaux_sociaux: 'reseaux_sociaux',
    rh: 'rh',
  };
  return map[role] || role;
}

export { getPoleFromRole };

export async function getCurrentUser(req: NextRequest): Promise<AuthUser | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);

  try {
    const { data: { user: supaUser }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !supaUser) return null;

    const user = await prisma.user.findUnique({
      where: { supabaseId: supaUser.id },
    });
    if (!user) return null;

    // Update last seen
    await prisma.user.update({
      where: { id: user.id },
      data: { lastSeenAt: new Date() },
    }).catch(() => {});

    return {
      id: user.id,
      supabaseId: user.supabaseId,
      name: user.name,
      email: user.email,
      role: user.role,
      pole: user.pole,
    };
  } catch {
    return null;
  }
}

export async function requireAuth(req: NextRequest): Promise<AuthUser> {
  const user = await getCurrentUser(req);
  if (!user) {
    throw new Error('Unauthenticated');
  }
  return user;
}

export async function requireRole(req: NextRequest, ...roles: string[]): Promise<AuthUser> {
  const user = await requireAuth(req);
  if (!roles.includes(user.role) && user.role !== 'admin') {
    throw new Error('Forbidden');
  }
  return user;
}

export function hasPermission(user: AuthUser, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[user.role] || [];
  return perms.includes('*') || perms.includes(permission);
}

export function authError(message = 'Unauthenticated', status = 401) {
  return Response.json({ message }, { status });
}

export function forbiddenError(message = 'Forbidden') {
  return Response.json({ message }, { status: 403 });
}
