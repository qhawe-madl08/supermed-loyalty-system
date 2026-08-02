import { getRepository } from '@/lib/db';
import { calculatePointsForPurchase } from '@/services/loyalty/points.service';
import type { Card, Customer, NewCustomerInput, PurchaseInput, RedemptionInput, Transaction } from '@/types';

export async function registerCustomer(input: NewCustomerInput): Promise<Customer> {
  const repository = getRepository();

  if (!input.first_name.trim() || !input.last_name.trim() || !input.phone.trim()) {
    throw new Error('First name, last name, and phone number are required');
  }

  return repository.createCustomer({
    ...input,
    first_name: input.first_name.trim(),
    last_name: input.last_name.trim(),
    phone: input.phone.trim(),
    email: input.email?.trim() || null,
  });
}

export async function assignCardToCustomer(cardId: string, customerId: string): Promise<Card> {
  return getRepository().assignCard(cardId, customerId);
}

export async function recordPurchase(input: PurchaseInput): Promise<Transaction> {
  const repository = getRepository();

  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error('Purchase amount must be greater than zero');
  }

  const settings = await repository.getSettings();
  const points = calculatePointsForPurchase(input.amount, settings.points_multiplier);

  return repository.recordPurchase({ ...input, points });
}

export async function redeemPoints(input: RedemptionInput): Promise<Transaction> {
  if (!Number.isInteger(input.points) || input.points <= 0) {
    throw new Error('Points to redeem must be a whole number greater than zero');
  }

  return getRepository().recordRedemption(input);
}

export function generateCardNumbers(prefix: string, start: number, count: number): string[] {
  const numbers: string[] = [];
  for (let index = 0; index < count; index += 1) {
    numbers.push(`${prefix}${String(start + index).padStart(6, '0')}`);
  }
  return numbers;
}
