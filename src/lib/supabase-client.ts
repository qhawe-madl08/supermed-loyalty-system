import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser singleton. Must never reference SUPABASE_SERVICE_ROLE_KEY.
// Cached on globalThis to survive Next.js Fast Refresh and avoid the
// "Multiple GoTrueClient instances" warning.
declare global {
  // eslint-disable-next-line no-var
  var __supermed_browser_client__: ReturnType<typeof createClient> | undefined;
}

export const supabase =
  globalThis.__supermed_browser_client__ ??
  (globalThis.__supermed_browser_client__ = createClient(supabaseUrl, supabaseAnonKey));