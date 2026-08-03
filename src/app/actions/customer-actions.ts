'use server';

import { createCustomer } from '@/services/customer/customer.repository';
import { issueCard } from '@/services/cards/card.repository';
import { ActionResult, success, duplicatePhoneError, serverError, validationError } from '@/lib/action-response';
import type { LegacyCustomerRecord } from '@/types';

export async function enrollCustomer(formData: FormData): Promise<ActionResult<LegacyCustomerRecord>> {
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

    // Issue a new loyalty card for every enrolled customer
    await issueCard(customer.id);

    return success(customer);
  } catch (error) {
    if (error instanceof Error && error.message === 'DUPLICATE_PHONE') {
      return duplicatePhoneError();
    }
    console.error('Customer enrollment error:', error);
    return serverError();
  }
}
