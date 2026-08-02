import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/db';
import { registerCustomer } from '@/services/loyalty/loyalty.service';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get('phone');
  const repository = getRepository();

  if (phone) {
    return NextResponse.json({ customer: await repository.findCustomerByPhone(phone) });
  }

  return NextResponse.json({ customers: await repository.listCustomers() });
}

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
