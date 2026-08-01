export function calculatePointsForPurchase(amountUsd: number, multiplier: number): number {
  if (!Number.isFinite(amountUsd) || !Number.isFinite(multiplier)) {
    throw new Error('Invalid purchase amount or multiplier');
  }

  return Math.floor(amountUsd * multiplier);
}
