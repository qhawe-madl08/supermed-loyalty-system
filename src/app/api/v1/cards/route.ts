import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/db';

export async function GET() {
  const cards = await getRepository().listCards();
  return NextResponse.json({ cards, count: cards.length });
}

export async function POST(request: Request) {
  const body = await request.json();
  const cardNumbers: string[] = Array.isArray(body.card_numbers)
    ? body.card_numbers
    : body.card_number
      ? [body.card_number]
      : [];

  if (cardNumbers.length === 0) {
    return NextResponse.json({ error: 'card_number or card_numbers is required' }, { status: 400 });
  }

  const cards = await getRepository().createCards(cardNumbers);
  return NextResponse.json({ cards, count: cards.length }, { status: 201 });
}
