import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const PILOT_CARDS = [
  'SM000001',
  'SM000002',
  'SM000003',
  'SM000004',
  'SM000005',
  'SM000006',
  'SM000007',
  'SM000008',
  'SM000009',
  'SM000010',
];

const TENANT_ID = '036c0f07-08af-42c8-ba6e-690ff4ecf53c';

async function seedPilotCards() {
  console.log('Seeding 10 physical pilot cards...');

  let created = 0;
  let skipped = 0;

  for (const cardCode of PILOT_CARDS) {
    // Check if card already exists
    const { data: existing } = await supabase
      .from('loyalty_cards')
      .select('id, status')
      .eq('card_code', cardCode)
      .maybeSingle();

    if (existing) {
      console.log(`Card ${cardCode} already exists (status: ${existing.status})`);
      skipped++;
      continue;
    }

    // Create the card
    const { data, error } = await supabase
      .from('loyalty_cards')
      .insert({
        tenant_id: TENANT_ID,
        customer_id: null,
        card_code: cardCode,
        card_type: 'qr',
        status: 'available',
      })
      .select()
      .single();

    if (error) {
      console.error(`Failed to create card ${cardCode}:`, error);
    } else {
      console.log(`Created card ${cardCode} (id: ${data.id})`);
      created++;
    }
  }

  console.log(`\nSummary: ${created} created, ${skipped} skipped`);
}

seedPilotCards()
  .then(() => {
    console.log('Pilot card seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Pilot card seeding failed:', error);
    process.exit(1);
  });
