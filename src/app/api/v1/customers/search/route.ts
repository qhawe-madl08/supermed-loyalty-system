import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') ?? searchParams.get('phone') ?? '';
  const customers = await getRepository().searchCustomers(query);
  return NextResponse.json({ customers, count: customers.length });
}
