import { NextResponse } from 'next/server';
import { readStore, writeStore } from '@/lib/data-store';

export async function GET() {
  const store = await readStore();
  return NextResponse.json({ settings: store.settings });
}

export async function POST(request: Request) {
  const store = await readStore();
  const body = await request.json();
  store.settings = {
    ...store.settings,
    points_multiplier: body.points_multiplier ?? store.settings.points_multiplier,
    currency: body.currency ?? store.settings.currency,
  };
  await writeStore(store);
  return NextResponse.json({ settings: store.settings });
}
