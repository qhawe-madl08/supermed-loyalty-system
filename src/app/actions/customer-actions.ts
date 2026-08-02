'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { assignCardToCustomer, registerCustomer } from '@/services/loyalty/loyalty.service';

export async function enrollCustomer(formData: FormData) {
  const customer = await registerCustomer({
    first_name: String(formData.get('first_name') ?? ''),
    last_name: String(formData.get('last_name') ?? ''),
    phone: String(formData.get('phone') ?? ''),
    email: String(formData.get('email') ?? '') || null,
    card_id: String(formData.get('card_id') ?? '') || null,
  });

  revalidatePath('/workflows/customers');
  redirect(`/workflows/customers/${customer.id}`);
}

export async function assignCard(formData: FormData) {
  const cardId = String(formData.get('card_id') ?? '');
  const customerId = String(formData.get('customer_id') ?? '');

  if (!cardId || !customerId) {
    throw new Error('A card and a customer are required');
  }

  await assignCardToCustomer(cardId, customerId);
  revalidatePath(`/workflows/customers/${customerId}`);
}
