import { promises as fs } from 'fs';
import path from 'path';

const storePath = path.join(process.cwd(), '.data', 'loyalty-store.json');
const store = JSON.parse(await fs.readFile(storePath, 'utf8'));

console.log({
  cards: store.cards.length,
  customers: store.customers.length,
  transactions: store.transactions.length,
  settings: store.settings,
});
