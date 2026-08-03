import { createSupabaseServerClient } from '@/lib/auth';
import { getDefaultTenantId } from '@/lib/tenant-helper';
import type { SettingsRecord } from '@/types';

export async function getSettings(): Promise<SettingsRecord> {
  const tenantId = await getDefaultTenantId();

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('settings')
    .select('points_multiplier, currency')
    .eq('tenant_id', tenantId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // If no settings exist yet, return defaults
      return {
        points_multiplier: 1,
        currency: 'USD',
      };
    }
    throw new Error(`Failed to fetch settings: ${error.message}`);
  }

  return {
    points_multiplier: data.points_multiplier,
    currency: data.currency ?? 'USD',
  };
}
