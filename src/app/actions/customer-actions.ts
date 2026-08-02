'use server';

import { createCustomer } from '@/services/customer/customer.repository.json';
import { assignCard } from '@/services/cards/card.repository.json';
import { ActionResult, success, duplicatePhoneError, cardAlreadyAssignedError, validationError, serverError } from '@/lib/action-response';

export async function enrollCustomer(formData: FormData): Promise<ActionResult> {
  try {
    const firstName = String(formData.get('first_name') ?? '').trim();
    const lastName = String(formData.get('last_name') ?? '').trim();
    const phone = String(formData.get('phone') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();
    const cardId = String(formData.get('card_id') ?? '').trim();

    if (!firstName || !lastName || !phone) {
      return validationError('First name, last name, and phone are required.');
    }

    const customer = await createCustomer({
      first_name: firstName,
      last_name: lastName,
      phone,
      email: email || null,
      card_id: cardId || null,
    });

    if (cardId) {
      try {
        await assignCard(cardId, customer.id);
      } catch (error) {
        if (error instanceof Error && error.message === 'CARD_ALREADY_ASSIGNED') {
          return cardAlreadyAssignedError();
        }
        throw error;
      }
    }

    return success(customer);
  } catch (error) {
    if (error instanceof Error && error.message === 'DUPLICATE_PHONE') {
      return duplicatePhoneError();
    }
    console.error('Customer enrollment error:', error);
    return serverError();
  }
}
