import { NextResponse } from 'next/server';
import { registerCustomer } from '@/services/loyalty/loyalty.service';

export async function POST(request: Request) {
  const body = await request.json();

  try {
    const customer = await registerCustomer({
      first_name: body.first_name ?? '',
      last_name: body.last_name ?? '',
      phone: body.phone ?? '',
      email: body.email,
      card_id: body.card_id,
    });
    return NextResponse.json({ customer }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
