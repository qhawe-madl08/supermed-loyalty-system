import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { logAuthEvent } from '@/services/audit/audit.service';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies: () => cookies() });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      await logAuthEvent('failed_login', undefined, { email, error: error.message }, 'failure');
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    // Audit successful login
    await logAuthEvent('login', data.user.id, { email });

    // Get JWT claims to extract role
    const token = data.session?.access_token;
    let staffRole = null;
    if (token) {
      try {
        const payload = token.split('.')[1];
        const decoded = Buffer.from(payload, 'base64').toString('utf-8');
        const jwtClaims = JSON.parse(decoded);
        staffRole = jwtClaims.staff_role || null;
      } catch (e) {
        console.error('Failed to decode JWT:', e);
      }
    }

    return NextResponse.json({ 
      success: true,
      role: staffRole
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
