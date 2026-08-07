import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { findCardByCode } from '@/services/cards/card.repository';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { error: 'Card code is required' },
        { status: 400 }
      );
    }

    // Validate card exists and belongs to tenant
    const card = await findCardByCode(code);

    if (!card) {
      return NextResponse.json(
        { error: 'Card not found' },
        { status: 404 }
      );
    }

    // Return card status for decision engine
    return NextResponse.json({
      id: card.id,
      card_number: card.card_number,
      status: card.status,
      customer_id: card.assigned_customer_id || null,
    });
  } catch (error) {
    console.error('Card lookup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
