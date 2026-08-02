/**
 * Seeds the local JSON development store (DATA_BACKEND=json).
 * Production data lives in Supabase and is seeded with supabase/seed.sql.
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const storePath = path.join(process.cwd(), '.data', 'loyalty-store.json');
fs.mkdirSync(path.dirname(storePath), { recursive: true });

const now = new Date().toISOString();
const cards = Array.from({ length: 20 }, (_, index) => ({
  id: crypto.randomUUID(),
  card_number: `SM${String(index + 1).padStart(6, '0')}`,
  status: 'AVAILABLE',
  customer_id: null,
  created_at: now,
}));

fs.writeFileSync(
  storePath,
  JSON.stringify(
    {
      settings: { points_multiplier: 1, currency: 'USD' },
      cards,
      customers: [],
      transactions: [],
    },
    null,
    2
  )
);

console.log(`Seeded ${cards.length} loyalty cards into ${storePath}`);
