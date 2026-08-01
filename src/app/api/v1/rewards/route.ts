import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    rewards: [
      { id: 'reward-1', name: 'Free item', points_cost: 100, description: 'Redeemable in store' },
    ],
    count: 1,
  });
}
