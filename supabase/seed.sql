insert into tenants (id, name, slug) values
  ('11111111-1111-1111-1111-111111111111', 'Supermed Pharmacy', 'supermed');

insert into branches (id, tenant_id, name, address) values
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Bulawayo CBD', 'Fife Street');

insert into rewards (id, tenant_id, name, description, points_cost, reward_type, value) values
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', '$2 off next purchase', 'Redeemable in store', 200, 'discount_amount', 2.00);
