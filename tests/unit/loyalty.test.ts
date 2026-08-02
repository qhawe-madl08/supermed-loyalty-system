import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

let workingDirectory: string;

beforeEach(async () => {
  workingDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'supermed-store-'));
  jest.spyOn(process, 'cwd').mockReturnValue(workingDirectory);
  jest.resetModules();
});

afterEach(async () => {
  jest.restoreAllMocks();
  await fs.rm(workingDirectory, { recursive: true, force: true });
});

async function loadModules() {
  process.env.DATA_BACKEND = 'json';
  const { getRepository } = await import('@/lib/db');
  const service = await import('@/services/loyalty/loyalty.service');
  return { repository: getRepository(), service };
}

describe('loyalty workflow on the JSON backend', () => {
  it('awards floor(amount x multiplier) points and updates the balance', async () => {
    const { repository, service } = await loadModules();

    const customer = await service.registerCustomer({
      first_name: 'Ada',
      last_name: 'Lovelace',
      phone: '+263771111111',
    });

    const purchase = await service.recordPurchase({ customer_id: customer.id, amount: 42.75 });

    expect(purchase.points).toBe(42);
    expect(purchase.balance_after).toBe(42);
    expect((await repository.getCustomer(customer.id))?.points_balance).toBe(42);
  });

  it('rejects a redemption larger than the balance', async () => {
    const { service } = await loadModules();

    const customer = await service.registerCustomer({
      first_name: 'Bongani',
      last_name: 'Dube',
      phone: '+263772222222',
    });
    await service.recordPurchase({ customer_id: customer.id, amount: 10 });

    await expect(service.redeemPoints({ customer_id: customer.id, points: 50 })).rejects.toThrow(
      'Insufficient points balance'
    );
  });

  it('assigns an available card and finds the customer by card number', async () => {
    const { repository, service } = await loadModules();

    const [card] = await repository.createCards(['SM000001']);
    const customer = await service.registerCustomer({
      first_name: 'Chipo',
      last_name: 'Moyo',
      phone: '+263773333333',
      card_id: card.id,
    });

    const [found] = await repository.searchCustomers('SM000001');

    expect(found.id).toBe(customer.id);
    expect((await repository.listCards())[0].status).toBe('ASSIGNED');
  });

  it('refuses to assign a card that already belongs to someone else', async () => {
    const { repository, service } = await loadModules();

    const [card] = await repository.createCards(['SM000002']);
    const first = await service.registerCustomer({
      first_name: 'Dumi',
      last_name: 'Ncube',
      phone: '+263774444444',
      card_id: card.id,
    });
    const second = await service.registerCustomer({
      first_name: 'Eve',
      last_name: 'Sibanda',
      phone: '+263775555555',
    });

    expect(first.card_id).toBe(card.id);
    await expect(service.assignCardToCustomer(card.id, second.id)).rejects.toThrow(
      'Card is already assigned to another customer'
    );
  });

  it('rejects a duplicate phone number', async () => {
    const { service } = await loadModules();

    await service.registerCustomer({ first_name: 'Farai', last_name: 'Zulu', phone: '+263776666666' });

    await expect(
      service.registerCustomer({ first_name: 'Other', last_name: 'Person', phone: '+263776666666' })
    ).rejects.toThrow('already exists');
  });
});
