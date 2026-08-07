import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSession } from './auth';

let cachedTenantId: string | null = null;

/**
 * Get the tenant_id from the authenticated user's JWT claims.
 * This ensures RLS policies work correctly since they use auth_tenant_id().
 */
export async function getAuthenticatedTenantId(): Promise<string | null> {
  const session = await getSession();
  if (!session) {
    return null;
  }

  const token = session.access_token;
  if (!token) {
    return null;
  }

  try {
    const payload = token.split('.')[1];
    const decoded = Buffer.from(payload, 'base64').toString('utf-8');
    const claims = JSON.parse(decoded);
    return claims.tenant_id || null;
  } catch (e) {
    console.error('Failed to decode JWT for tenant_id:', e);
    return null;
  }
}

/**
 * Get the staff_id from the authenticated user's JWT claims.
 */
export async function getAuthenticatedStaffId(): Promise<string | null> {
  const session = await getSession();
  if (!session) {
    return null;
  }

  const user = session.user;
  if (!user) {
    return null;
  }

  return user.id || null;
}

/**
 * Get the branch_id from the authenticated user's JWT claims.
 */
export async function getAuthenticatedBranchId(): Promise<string | null> {
  const session = await getSession();
  if (!session) {
    return null;
  }

  const token = session.access_token;
  if (!token) {
    return null;
  }

  try {
    const payload = token.split('.')[1];
    const decoded = Buffer.from(payload, 'base64').toString('utf-8');
    const claims = JSON.parse(decoded);
    return claims.branch_id || null;
  } catch (e) {
    console.error('Failed to decode JWT for branch_id:', e);
    return null;
  }
}

/**
 * Get the default tenant_id for operations that don't have an authenticated context.
 * This uses the service role client and should only be used in specific scenarios.
 */
export async function getDefaultTenantId(): Promise<string> {
  if (cachedTenantId) {
    return cachedTenantId;
  }

  if (process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID) {
    cachedTenantId = process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID;
    return cachedTenantId;
  }

  const { data, error } = await supabaseAdmin
    .from('tenants')
    .select('id')
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn('Error fetching tenant:', error.message);
  }

  cachedTenantId = data?.id ?? '00000000-0000-0000-0000-000000000001';
  return cachedTenantId as string;
}
