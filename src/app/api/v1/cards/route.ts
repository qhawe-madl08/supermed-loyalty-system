import { NextResponse } from 'next/server';
import { bulkRegisterCards, listCards } from '@/services/cards/card.repository';

export async function GET() {
  const cards = await listCards();
  return NextResponse.json({ cards });
}

export async function POST(request: Request) {
  const body = await request.json();
  const cardNumbers = Array.isArray(body.card_numbers) ? body.card_numbers : [body.card_number];
  const cards = await bulkRegisterCards(cardNumbers);
  return NextResponse.json({ cards });
}
