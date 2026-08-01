import { NextResponse } from 'next/server';
import { createCustomer } from '@/services/customer/customer.repository';
import { assignCard } from '@/services/cards/card.repository';
import { readStore } from '@/lib/data-store';

export async function GET() {
  const store = await readStore();
  return NextResponse.json({
    message: 'Use POST to enroll a customer',
    customer_count: store.customers.length,
    available_cards: store.cards.filter((card) => card.status === 'AVAILABLE').length,
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const store = await readStore();
  const customer = await createCustomer({
    first_name: body.first_name,
    last_name: body.last_name,
    phone: body.phone,
    email: body.email,
    card_id: body.card_id,
  });

  if (body.card_id) {
    const card = store.cards.find((entry) => entry.id === body.card_id);
    if (card) {
      await assignCard(card.id, customer.id);
    }
  }

  return NextResponse.json({ customer });
}
