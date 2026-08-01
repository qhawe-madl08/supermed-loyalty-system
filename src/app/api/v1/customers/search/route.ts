import { NextResponse } from 'next/server';
import { findCustomerByPhone } from '@/services/customer/customer.repository';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get('phone') ?? '';
  const customer = await findCustomerByPhone(phone);
  return NextResponse.json({ customer_summary: customer ?? null });
}
