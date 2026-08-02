-- ============================================================================
-- Physical card inventory + configurable points settings.
--
-- Purpose
--   1. Allow unassigned cards: loyalty_cards.customer_id becomes nullable and
--      defaults to the 'available' state, so admins can load a batch of blank
--      pre-printed cards and staff assign them later.
--   2. Move the points multiplier out of the local JSON file and into the
--      database, because a serverless deployment cannot persist file writes.
--
-- Rollback
--   Only safe before cards are loaded:
--     drop index idx_cards_one_active_per_customer;
--     alter table loyalty_cards alter column customer_id set not null;
--     drop table app_settings;
--
-- Manual execution
--   supabase db push   (or paste into the Supabase SQL editor)
-- ============================================================================

alter table loyalty_cards alter column customer_id drop not null;
alter table loyalty_cards alter column status set default 'available';

-- A customer holds at most one active card at a time.
create unique index if not exists idx_cards_one_active_per_customer
    on loyalty_cards (tenant_id, customer_id)
    where customer_id is not null and status = 'assigned';

create table if not exists app_settings (
    tenant_id           uuid primary key references tenants(id) on delete cascade,
    points_multiplier   numeric(10,4) not null default 1,
    currency            currency_code not null default 'USD',
    updated_at          timestamptz not null default now()
);

alter table app_settings enable row level security;

create policy tenant_isolation_select on app_settings for select using (tenant_id = auth_tenant_id());

create policy admin_up_manage_settings on app_settings for all
    using (tenant_id = auth_tenant_id() and auth_staff_role() in ('admin','owner'))
    with check (tenant_id = auth_tenant_id() and auth_staff_role() in ('admin','owner'));
