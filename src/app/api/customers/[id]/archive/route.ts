import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { logCustomerEvent } from '@/services/audit/audit.service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies: () => cookies() });
    const { id } = await params;

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

    // Check permissions: Manager, Admin, or Owner can archive
    if (userRole !== 'manager' && userRole !== 'admin' && userRole !== 'owner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get customer before archiving for audit
    const { data: customer, error: fetchError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Archive customer (soft delete)
    const { error: updateError } = await supabase
      .from('customers')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: user.id,
        is_active: false,
      })
      .eq('id', id);

    if (updateError) {
      console.error('Failed to archive customer:', updateError);
      return NextResponse.json({ error: 'Failed to archive customer' }, { status: 500 });
    }

    // Audit the archive action
    await logCustomerEvent('archived', id, 
      { is_active: customer.is_active, deleted_at: null },
      { is_active: false, deleted_at: new Date().toISOString() }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Archive customer error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
