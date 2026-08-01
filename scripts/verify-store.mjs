import { readStore } from '../src/lib/data-store.ts';

const store = await readStore();
console.log(JSON.stringify({
  cards: store.cards.length,
  customers: store.customers.length,
  transactions: store.transactions.length,
  settings: store.settings,
}, null, 2));
