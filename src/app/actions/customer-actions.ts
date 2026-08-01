'use server';

import { createCustomer } from '@/services/customer/customer.repository';
import { assignCard } from '@/services/cards/card.repository';
import { readStore } from '@/lib/data-store';
import { redirect } from 'next/navigation';

export async function enrollCustomer(formData: FormData) {
  const firstName = String(formData.get('first_name') ?? '').trim();
  const lastName = String(formData.get('last_name') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const cardId = String(formData.get('card_id') ?? '').trim();

  if (!firstName || !lastName || !phone) {
    throw new Error('First name, last name, and phone are required.');
  }

  const customer = await createCustomer({
    first_name: firstName,
    last_name: lastName,
    phone,
    email: email || null,
    card_id: cardId || null,
  });

  if (cardId) {
    const store = await readStore();
    const card = store.cards.find((entry) => entry.id === cardId);
    if (card) {
      await assignCard(card.id, customer.id);
    }
  }

  redirect('/workflows');
}
