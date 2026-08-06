import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies: () => cookies() });

    // Get session from authenticated client
    const { data: { session } } = await supabase.auth.getSession();
    const { data: { user } } = await supabase.auth.getUser();

    // Get JWT claims
    const token = session?.access_token;
    let jwtClaims: any = null;
    if (token) {
      try {
        const payload = token.split('.')[1];
        const decoded = Buffer.from(payload, 'base64').toString('utf-8');
        jwtClaims = JSON.parse(decoded);
      } catch (e) {
        console.error('Failed to decode JWT:', e);
      }
    }

    // Get staff_users record using service role
    let staffRecord = null;
    if (user) {
      const { data } = await supabaseAdmin
        .from('staff_users')
        .select('*')
        .eq('auth_user_id', user.id)
        .maybeSingle();
      staffRecord = data;
    }

    return NextResponse.json({
      user_id: user?.id || null,
      email: user?.email || null,
      jwt_claims: {
        tenant_id: jwtClaims?.tenant_id || null,
        staff_role: jwtClaims?.staff_role || null,
        aud: jwtClaims?.aud || null,
        role: jwtClaims?.role || null,
      },
      staff_users_record: staffRecord,
      session_exists: !!session,
    });
  } catch (error) {
    console.error('Auth context debug error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve auth context', details: String(error) },
      { status: 500 }
    );
  }
}
