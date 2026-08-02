import { jsonRepository } from '@/lib/db/json-repository';
import { supabaseRepository } from '@/lib/db/supabase-repository';
import type { LoyaltyRepository } from '@/lib/db/repository';

export type DataBackend = 'json' | 'supabase';

/**
 * `json` is a local development convenience only: it writes to a file, which
 * does not work on serverless hosting. Production must run with `supabase`.
 */
export function activeBackend(): DataBackend {
  const configured = process.env.DATA_BACKEND;
  if (configured === 'json' || configured === 'supabase') return configured;
  return process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? 'supabase'
    : 'json';
}

export function getRepository(): LoyaltyRepository {
  return activeBackend() === 'supabase' ? supabaseRepository : jsonRepository;
}

export type { LoyaltyRepository };
