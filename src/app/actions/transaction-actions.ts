'use server';

import { getSettings } from '@/services/settings/settings.repository';
import { createPurchaseTransaction, createRedemptionTransaction } from '@/services/transactions/transaction.repository';
import { getCurrentCustomerBalance } from '@/services/customer/customer.repository';
import { ActionResult, success, insufficientPointsError, customerNotFoundError, validationError, serverError } from '@/lib/action-response';
import { checkIdempotency, recordIdempotency, generateIdempotencyKey } from '@/services/idempotency/idempotency.repository';
import { logTransactionEvent } from '@/services/audit/audit.service';
import type { LegacyTransactionRecord } from '@/types';

export async function recordTransaction(formData: FormData): Promise<ActionResult<LegacyTransactionRecord>> {
  try {
    const customerId = String(formData.get('customer_id') ?? '').trim();
    const type = String(formData.get('transaction_type') ?? '').trim() as 'PURCHASE' | 'REDEMPTION';
    const amountStr = String(formData.get('amount') ?? '').trim();
    const pointsStr = String(formData.get('points') ?? '').trim();
    const notes = String(formData.get('notes') ?? '').trim();
    const idempotencyKey = String(formData.get('idempotency_key') ?? '').trim() || generateIdempotencyKey();

    if (!customerId) {
      return validationError<LegacyTransactionRecord>('Customer ID is required.');
    }

    // Check idempotency
    const existingResult = await checkIdempotency(idempotencyKey);
    if (existingResult) {
      return existingResult;
    }

    const settings = await getSettings();

    let result: ActionResult<LegacyTransactionRecord>;

    if (type === 'PURCHASE') {
      const amount = parseFloat(amountStr);
      if (isNaN(amount) || amount <= 0) {
        return validationError<LegacyTransactionRecord>('A valid purchase amount is required.');
      }
      const transaction = await createPurchaseTransaction({
        customerId,
        amountUsd: amount,
        multiplier: settings.points_multiplier,
        notes: notes || null,
      });
      
      // Audit purchase transaction
      await logTransactionEvent('purchase', transaction.id,
        { balance_before: transaction.balance_before },
        { 
          balance_after: transaction.balance_after,
          points: transaction.points,
          amount: transaction.purchase_amount,
        }
      );
      
      result = success(transaction);
    } else if (type === 'REDEMPTION') {
      const points = parseInt(pointsStr, 10);
      if (isNaN(points) || points <= 0) {
        return validationError<LegacyTransactionRecord>('A valid points amount is required.');
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
      
      // Audit redemption transaction
      await logTransactionEvent('redemption', transaction.id,
        { balance_before: transaction.balance_before },
        {
          balance_after: transaction.balance_after,
          points: transaction.points,
        }
      );
      
      result = success(transaction);
    } else {
      return validationError<LegacyTransactionRecord>('Invalid transaction type.');
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
