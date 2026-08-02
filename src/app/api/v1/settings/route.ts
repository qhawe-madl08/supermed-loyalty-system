import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/db';

export async function GET() {
  return NextResponse.json({ settings: await getRepository().getSettings() });
}

export async function POST(request: Request) {
  const body = await request.json();
  const settings = await getRepository().updateSettings({
    points_multiplier: body.points_multiplier,
    currency: body.currency,
  });
  return NextResponse.json({ settings });
}
