import { calculatePointsForPurchase } from '../../src/services/loyalty/points.service';

describe('calculatePointsForPurchase', () => {
  it('rounds down purchase points using the configured multiplier', () => {
    expect(calculatePointsForPurchase(24.3, 1)).toBe(24);
    expect(calculatePointsForPurchase(18.9, 1)).toBe(18);
  });

  it('supports alternate multipliers', () => {
    expect(calculatePointsForPurchase(10, 2)).toBe(20);
    expect(calculatePointsForPurchase(10, 0.5)).toBe(5);
  });
});
