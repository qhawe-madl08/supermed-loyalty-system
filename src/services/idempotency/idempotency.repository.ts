import { createSupabaseServerClient } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function checkIdempotency(key: string): Promise<any | null> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('idempotency_records')
    .select('response, expires_at')
    .eq('key', key)
    .maybeSingle();

  if (error) {
    console.error('Failed to check idempotency:', error.message);
    return null;
  }

  if (data) {
    const expiresAt = new Date(data.expires_at);
    if (expiresAt > new Date()) {
      return data.response;
    }
  }

  return null;
}

export async function recordIdempotency(key: string, response: any): Promise<void> {
  const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
  const now = new Date();
  const expiresAt = new Date(now.getTime() + IDEMPOTENCY_TTL_MS);

  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from('idempotency_records')
    .insert({
      id: uuidv4(),
      key,
      response,
      created_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    });

  if (error) {
    console.error('Failed to record idempotency:', error.message);
  }
}

export function generateIdempotencyKey(): string {
  return uuidv4();
}
