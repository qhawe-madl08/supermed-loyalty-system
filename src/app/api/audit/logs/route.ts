export const dynamic = 'force-dynamic';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies: () => cookies() });

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get JWT claims to check role
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    let userRole = null;
    if (token) {
      try {
        const payload = token.split('.')[1];
        const decoded = Buffer.from(payload, 'base64').toString('utf-8');
        const jwtClaims = JSON.parse(decoded);
        userRole = jwtClaims.staff_role || null;
      } catch (e) {
        console.error('Failed to decode JWT:', e);
      }
    }

    // Check if user has permission (admin or owner only)
    if (userRole !== 'admin' && userRole !== 'owner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch audit logs with pagination
    const page = 1;
    const limit = 50;

    const { data: auditLogs, error } = await supabase
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      console.error('Failed to fetch audit logs:', error);
      return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
    }

    return NextResponse.json({ logs: auditLogs });
  } catch (error) {
    console.error('Audit logs fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
