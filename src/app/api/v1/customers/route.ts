import { NextResponse } from 'next/server';
import { createCustomer, findCustomerByPhone, listCustomers } from '@/services/customer/customer.repository';
import { assignCard } from '@/services/cards/card.repository';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get('phone');

  if (phone) {
    const customer = await findCustomerByPhone(phone);
    return NextResponse.json({ customer });
  }

  const customers = await listCustomers();
  return NextResponse.json({ customers });
}

export async function POST(request: Request) {
  const body = await request.json();
  const customer = await createCustomer({
    first_name: body.first_name,
    last_name: body.last_name,
    phone: body.phone,
    email: body.email,
    card_id: body.card_id,
  });

  if (body.card_id) {
    await assignCard(body.card_id, customer.id);
  }

  return NextResponse.json({ customer });
}
