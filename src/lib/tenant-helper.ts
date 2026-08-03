import { supabaseAdmin } from '@/lib/supabase-admin';

let cachedTenantId: string | null = null;

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
