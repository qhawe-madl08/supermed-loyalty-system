import { formatCustomerName } from '../../src/lib/workflow';

describe('formatCustomerName', () => {
  it('uses the full name when available', () => {
    expect(formatCustomerName({ first_name: 'Ava', last_name: 'Ngwenya', phone: '+263771111111' })).toBe('Ava Ngwenya');
  });

  it('falls back to the phone number when no name is present', () => {
    expect(formatCustomerName({ first_name: '', last_name: '', phone: '+263772222222' })).toBe('+263772222222');
  });
});
