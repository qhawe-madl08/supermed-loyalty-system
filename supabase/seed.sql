-- Baseline data for a fresh Supermed environment.
-- The tenant id here must match SUPERMED_TENANT_ID in the app environment.

insert into tenants (id, name, slug) values
  ('11111111-1111-1111-1111-111111111111', 'Supermed Pharmacy', 'supermed')
on conflict (id) do nothing;

insert into branches (id, tenant_id, name, address) values
  ('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', 'Branch 1', ''),
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Branch 2', ''),
  ('22222222-2222-2222-2222-222222222223', '11111111-1111-1111-1111-111111111111', 'Branch 3', ''),
  ('22222222-2222-2222-2222-222222222224', '11111111-1111-1111-1111-111111111111', 'Branch 4', ''),
  ('22222222-2222-2222-2222-222222222225', '11111111-1111-1111-1111-111111111111', 'Branch 5', '')
on conflict (id) do nothing;

insert into app_settings (tenant_id, points_multiplier, currency) values
  ('11111111-1111-1111-1111-111111111111', 1, 'USD')
on conflict (tenant_id) do nothing;

-- Example card inventory. Replace with the real pre-printed card numbers.
insert into loyalty_cards (tenant_id, card_code, card_type, status)
select '11111111-1111-1111-1111-111111111111', 'SM' || lpad(series::text, 6, '0'), 'barcode', 'available'
from generate_series(1, 20) as series
on conflict (tenant_id, card_code) do nothing;
