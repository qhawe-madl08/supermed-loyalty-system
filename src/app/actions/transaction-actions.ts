'use server';

import { readStore } from '@/lib/data-store';
import { createPurchaseTransaction, createRedemptionTransaction } from '@/services/transactions/transaction.repository.json';
import { getCurrentCustomerBalance } from '@/services/customer/customer.repository.json';
import { ActionResult, success, insufficientPointsError, customerNotFoundError, validationError, serverError } from '@/lib/action-response';
import { checkIdempotency, recordIdempotency, generateIdempotencyKey } from '@/lib/idempotency';

export async function recordTransaction(formData: FormData): Promise<ActionResult> {
  try {
    const customerId = String(formData.get('customer_id') ?? '').trim();
    const type = String(formData.get('transaction_type') ?? '').trim() as 'PURCHASE' | 'REDEMPTION';
    const amountStr = String(formData.get('amount') ?? '').trim();
    const pointsStr = String(formData.get('points') ?? '').trim();
    const notes = String(formData.get('notes') ?? '').trim();
    const idempotencyKey = String(formData.get('idempotency_key') ?? '').trim() || generateIdempotencyKey();

    if (!customerId) {
      return validationError('Customer ID is required.');
    }

    // Check idempotency
    const existingResult = await checkIdempotency(idempotencyKey);
    if (existingResult) {
      return existingResult;
    }

    const store = await readStore();
    const settings = store.settings;

    let result: ActionResult;

    if (type === 'PURCHASE') {
      const amount = parseFloat(amountStr);
      if (isNaN(amount) || amount <= 0) {
        return validationError('A valid purchase amount is required.');
      }
      const transaction = await createPurchaseTransaction({
        customerId,
        amountUsd: amount,
        multiplier: settings.points_multiplier,
        notes: notes || null,
      });
      result = success(transaction);
    } else if (type === 'REDEMPTION') {
      const points = parseInt(pointsStr, 10);
      if (isNaN(points) || points <= 0) {
        return validationError('A valid points amount is required.');
      }

      const currentBalance = await getCurrentCustomerBalance(customerId);
      if (currentBalance < points) {
        return insufficientPointsError(currentBalance);
      }

      const transaction = await createRedemptionTransaction({
        customerId,
        points,
        notes: notes || null,
      });
      result = success(transaction);
    } else {
      return validationError('Invalid transaction type.');
    }

    // Record idempotency
    await recordIdempotency(idempotencyKey, result);

    return result;
  } catch (error) {
    if (error instanceof Error && error.message === 'CUSTOMER_NOT_FOUND') {
      return customerNotFoundError();
    }
    if (error instanceof Error && error.message === 'INSUFFICIENT_POINTS') {
      const customerId = String(formData.get('customer_id') ?? '').trim();
      const currentBalance = await getCurrentCustomerBalance(customerId);
      return insufficientPointsError(currentBalance);
    }
    console.error('Transaction recording error:', error);
    return serverError();
  }
}
