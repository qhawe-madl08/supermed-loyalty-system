const fs = require('fs');
const path = require('path');

const storePath = path.join(process.cwd(), '.data', 'loyalty-store.json');
const directory = path.dirname(storePath);
fs.mkdirSync(directory, { recursive: true });

const seedStore = {
  settings: {
    points_multiplier: 1,
    currency: 'USD',
  },
  cards: [
    { id: 'card-001', card_number: 'SM000001', status: 'AVAILABLE', assigned_customer_id: null, created_at: new Date().toISOString() },
    { id: 'card-002', card_number: 'SM000002', status: 'AVAILABLE', assigned_customer_id: null, created_at: new Date().toISOString() },
  ],
  customers: [],
  transactions: [],
  audit_logs: [],
  idempotency_records: [],
};

fs.writeFileSync(storePath, JSON.stringify(seedStore, null, 2));
console.log('Seeded loyalty store');
