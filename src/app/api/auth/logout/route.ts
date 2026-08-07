import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { logAuthEvent } from '@/services/audit/audit.service';

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies: () => cookies() });

    // Get user ID before logout for audit
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.auth.signOut();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Audit logout
    if (user) {
      await logAuthEvent('logout', user.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
