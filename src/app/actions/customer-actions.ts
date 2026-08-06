'use server';

import { createCustomer } from '@/services/customer/customer.repository';
import { issueCard } from '@/services/cards/card.repository';
import { ActionResult, success, duplicatePhoneError, serverError, validationError } from '@/lib/action-response';
import type { LegacyCustomerRecord } from '@/types';

export async function enrollCustomer(formData: FormData): Promise<ActionResult<LegacyCustomerRecord>> {
  let createdCustomerId: string | null = null;

  try {
    const firstName = String(formData.get('first_name') ?? '').trim();
    const lastName = String(formData.get('last_name') ?? '').trim();
    const phone = String(formData.get('phone') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();

    if (!firstName || !lastName || !phone) {
      return validationError<LegacyCustomerRecord>('First name, last name, and phone are required.');
    }

    const customer = await createCustomer({
      first_name: firstName,
      last_name: lastName,
      phone,
      email: email || null,
    });

    createdCustomerId = customer.id;

    // Issue a new loyalty card for every enrolled customer
    await issueCard(customer.id);

    return success(customer);
  } catch (error) {
    // If card issuance fails after customer creation, we have an orphan customer
    // For now, we return an error. The customer record remains but has no card.
    // This should be addressed by either:
    // 1. Wrapping in a database transaction (requires client-side transaction)
    // 2. Adding compensation logic to delete the customer on card failure
    // 3. Making card assignment optional

    if (error instanceof Error && error.message === 'DUPLICATE_PHONE') {
      return duplicatePhoneError();
    }

    console.error('Customer enrollment error:', error);

    // If we created a customer but card issuance failed, note this in the error
    if (createdCustomerId) {
      console.error('Orphan customer created without card:', createdCustomerId);
      return serverError('Customer created but card assignment failed. Please assign a card manually.');
    }

    return serverError();
  }
}
