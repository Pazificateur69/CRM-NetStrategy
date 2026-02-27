import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET() {
  const checks: Record<string, any> = {
    env_database_url: process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:[^@]+@/, ':***@') : 'MISSING',
    env_supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'MISSING',
    env_service_key: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING',
  };

  // Test Prisma
  try {
    const count = await prisma.user.count();
    checks.prisma = `OK (${count} users)`;
  } catch (e: any) {
    checks.prisma = `ERROR: ${e.message.substring(0, 200)}`;
  }

  // Test Supabase Auth
  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1 });
    if (error) {
      checks.supabase_auth = `ERROR: ${error.message}`;
    } else {
      checks.supabase_auth = `OK (${data.users.length} users returned)`;
    }
  } catch (e: any) {
    checks.supabase_auth = `ERROR: ${e.message.substring(0, 200)}`;
  }

  return Response.json(checks);
}
