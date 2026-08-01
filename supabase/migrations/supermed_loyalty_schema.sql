-- ============================================================================
-- Supermed Loyalty & Customer Rewards Platform
-- Reference schema (Postgres / Supabase)
-- Companion to Supermed_Loyalty_Platform_SDD.md, Section 11
--
-- Design principles:
--   1. Shared-schema multi-tenancy: every business table carries tenant_id,
--      isolation enforced by Row Level Security (RLS), not separate schemas.
--   2. The points ledger is APPEND-ONLY. customers.points_balance is a
--      denormalized cache maintained by trigger; the ledger is always the
--      source of truth and can rebuild that cache from scratch.
--   3. idempotency_key is a hard unique constraint so offline-queued,
--      retried submissions are safe no-ops rather than double credits.
--   4. Every sensitive mutation is mirrored into audit_log.
--
-- This is a reference implementation to adapt, not a black box to run
-- unmodified against production. Review RLS policies for your exact
-- Supabase Auth JWT claim setup before deploying.
-- ============================================================================

create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ----------------------------------------------------------------------------
-- ENUM TYPES
-- ----------------------------------------------------------------------------

create type staff_role as enum ('owner', 'admin', 'manager', 'cashier');
create type card_type as enum ('qr', 'barcode', 'virtual');
create type card_status as enum ('active', 'lost', 'frozen', 'replaced', 'revoked');
create type ledger_txn_type as enum ('earn', 'redeem', 'adjustment', 'expiry', 'refund_reversal');
create type reward_type as enum ('discount_percent', 'discount_amount', 'free_item', 'other');
create type redemption_status as enum ('completed', 'voided');
create type import_source as enum ('manual', 'csv', 'api', 'webhook');
create type card_lifecycle_event_type as enum ('issued', 'reported_lost', 'frozen', 'replaced', 'reactivated', 'revoked');
create type currency_code as enum ('USD', 'ZWG');

-- ----------------------------------------------------------------------------
-- CORE TENANCY
-- ----------------------------------------------------------------------------

create table tenants (
    id                  uuid primary key default gen_random_uuid(),
    name                text not null,
    slug                text not null unique,
    default_currency    currency_code not null default 'USD',
    timezone            text not null default 'Africa/Harare',
    branding            jsonb not null default '{}'::jsonb, -- logo url, colors, etc (Phase 3 white-label)
    is_active           boolean not null default true,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now()
);

create table branches (
    id              uuid primary key default gen_random_uuid(),
    tenant_id       uuid not null references tenants(id) on delete cascade,
    name            text not null,
    address         text,
    phone           text,
    timezone        text not null default 'Africa/Harare',
    is_active       boolean not null default true,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now(),
    unique (tenant_id, name)
);

-- Staff accounts, linked to Supabase auth.users
create table staff_users (
    id              uuid primary key default gen_random_uuid(),
    tenant_id       uuid not null references tenants(id) on delete cascade,
    branch_id       uuid references branches(id) on delete set null, -- null = all-branch access (owner/admin)
    auth_user_id    uuid not null references auth.users(id) on delete cascade,
    full_name       text not null,
    role            staff_role not null default 'cashier',
    pin_hash        text, -- fast till re-auth; never store plaintext
    is_active       boolean not null default true,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now(),
    unique (tenant_id, auth_user_id)
);

-- ----------------------------------------------------------------------------
-- CUSTOMERS & CARDS
-- ----------------------------------------------------------------------------

create table tiers (
    id                  uuid primary key default gen_random_uuid(),
    tenant_id           uuid not null references tenants(id) on delete cascade,
    name                text not null,               -- e.g. 'Bronze', 'Silver', 'Gold'
    min_points_threshold integer not null default 0, -- rolling threshold to qualify
    benefits            jsonb not null default '{}'::jsonb,
    sort_order          integer not null default 0,
    created_at          timestamptz not null default now(),
    unique (tenant_id, name)
);

create table customers (
    id                  uuid primary key default gen_random_uuid(),
    tenant_id           uuid not null references tenants(id) on delete cascade,
    full_name           text not null,
    phone_e164          text not null,               -- e.g. +263771234567
    email               text,                        -- optional, not primary channel
    date_of_birth       date,                         -- optional, only if birthday rewards used
    tier_id             uuid references tiers(id) on delete set null,
    points_balance      integer not null default 0,  -- denormalized cache; ledger is source of truth
    preferred_channel    text not null default 'whatsapp', -- 'whatsapp' | 'sms'
    consent_given_at    timestamptz,                  -- Data Protection Act consent capture
    is_active           boolean not null default true,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now(),
    unique (tenant_id, phone_e164)
);

create index idx_customers_tenant_phone on customers (tenant_id, phone_e164);

create table loyalty_cards (
    id                      uuid primary key default gen_random_uuid(),
    tenant_id               uuid not null references tenants(id) on delete cascade,
    customer_id             uuid not null references customers(id) on delete cascade,
    card_code               text not null,            -- the QR/barcode payload, signed/rotatable
    card_type               card_type not null default 'qr',
    status                  card_status not null default 'active',
    issued_at               timestamptz not null default now(),
    replaced_from_card_id   uuid references loyalty_cards(id),
    created_at              timestamptz not null default now(),
    updated_at              timestamptz not null default now(),
    unique (tenant_id, card_code)
);

create index idx_cards_customer on loyalty_cards (customer_id);

create table card_lifecycle_events (
    id          uuid primary key default gen_random_uuid(),
    tenant_id   uuid not null references tenants(id) on delete cascade,
    card_id     uuid not null references loyalty_cards(id) on delete cascade,
    event_type  card_lifecycle_event_type not null,
    staff_id    uuid references staff_users(id),
    notes       text,
    created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- POINTS LEDGER (append-only, source of truth)
-- ----------------------------------------------------------------------------

create table points_ledger (
    id                  uuid primary key default gen_random_uuid(),
    tenant_id           uuid not null references tenants(id) on delete cascade,
    customer_id         uuid not null references customers(id) on delete cascade,
    branch_id           uuid references branches(id),
    staff_id            uuid references staff_users(id),
    txn_type            ledger_txn_type not null,
    points              integer not null,             -- positive for earn, negative for redeem/expiry
    currency            currency_code,
    amount              numeric(12,2),                -- underlying sale amount, if applicable
    reference_pos_txn_id uuid,                          -- optional link to pos_transactions
    reason              text,                          -- required for 'adjustment' type
    idempotency_key     uuid not null,                 -- client-generated; enables safe offline retry
    created_at          timestamptz not null default now(),
    unique (tenant_id, idempotency_key)
);

create index idx_ledger_customer on points_ledger (customer_id, created_at desc);
create index idx_ledger_tenant_created on points_ledger (tenant_id, created_at desc);

-- ----------------------------------------------------------------------------
-- REWARDS & REDEMPTIONS
-- ----------------------------------------------------------------------------

create table rewards (
    id              uuid primary key default gen_random_uuid(),
    tenant_id       uuid not null references tenants(id) on delete cascade,
    name            text not null,
    description     text,
    points_cost     integer not null,
    reward_type     reward_type not null,
    value           numeric(12,2),                    -- meaning depends on reward_type
    is_active       boolean not null default true,
    valid_from      timestamptz,
    valid_to        timestamptz,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

create table redemptions (
    id              uuid primary key default gen_random_uuid(),
    tenant_id       uuid not null references tenants(id) on delete cascade,
    customer_id     uuid not null references customers(id) on delete cascade,
    reward_id       uuid not null references rewards(id),
    branch_id       uuid references branches(id),
    staff_id        uuid references staff_users(id),
    points_spent    integer not null,
    ledger_entry_id uuid references points_ledger(id), -- the corresponding debit
    status          redemption_status not null default 'completed',
    created_at      timestamptz not null default now()
);

create index idx_redemptions_customer on redemptions (customer_id, created_at desc);

-- ----------------------------------------------------------------------------
-- POS INGESTION (Level 1-4, see SDD Section 10.3)
-- ----------------------------------------------------------------------------

create table pos_transactions (
    id                  uuid primary key default gen_random_uuid(),
    tenant_id           uuid not null references tenants(id) on delete cascade,
    branch_id           uuid references branches(id),
    customer_id         uuid references customers(id),
    external_pos_ref    text,                          -- receipt #, POS transaction id, etc
    amount              numeric(12,2) not null,
    currency            currency_code not null default 'USD',
    import_source       import_source not null default 'manual',
    raw_payload         jsonb,                         -- original CSV row / webhook body for audit
    matched_ledger_id   uuid references points_ledger(id),
    created_at          timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- CAMPAIGNS (Phase 2)
-- ----------------------------------------------------------------------------

create table campaigns (
    id              uuid primary key default gen_random_uuid(),
    tenant_id       uuid not null references tenants(id) on delete cascade,
    name            text not null,
    rule_type       text not null,                     -- e.g. 'bonus_multiplier', 'birthday', 'referral'
    rule_config     jsonb not null default '{}'::jsonb,
    starts_at       timestamptz,
    ends_at         timestamptz,
    is_active       boolean not null default true,
    created_at      timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- AUDIT LOG
-- ----------------------------------------------------------------------------

create table audit_log (
    id              uuid primary key default gen_random_uuid(),
    tenant_id       uuid not null references tenants(id) on delete cascade,
    actor_staff_id  uuid references staff_users(id),
    action          text not null,                     -- e.g. 'points.adjust', 'card.freeze'
    entity_type     text not null,                     -- e.g. 'customers', 'loyalty_cards'
    entity_id       uuid,
    before          jsonb,
    after           jsonb,
    created_at      timestamptz not null default now()
);

create index idx_audit_tenant_created on audit_log (tenant_id, created_at desc);

-- ============================================================================
-- TRIGGERS: keep customers.points_balance in sync with the ledger
-- ============================================================================

create or replace function fn_apply_ledger_to_balance()
returns trigger as $$
begin
    update customers
    set points_balance = points_balance + new.points,
        updated_at = now()
    where id = new.customer_id;
    return new;
end;
$$ language plpgsql security definer;

create trigger trg_points_ledger_balance
after insert on points_ledger
for each row execute function fn_apply_ledger_to_balance();

-- Utility: rebuild a customer's cached balance from the ledger from scratch
-- (use if the cache is ever suspected to have drifted from the source of truth)
create or replace function fn_rebuild_customer_balance(p_customer_id uuid)
returns void as $$
begin
    update customers c
    set points_balance = coalesce((
        select sum(pl.points) from points_ledger pl where pl.customer_id = p_customer_id
    ), 0)
    where c.id = p_customer_id;
end;
$$ language plpgsql security definer;

-- ============================================================================
-- ROW LEVEL SECURITY
--
-- Assumes staff JWTs carry a 'tenant_id' custom claim (set via a Supabase
-- Auth hook or app_metadata at staff account creation). Customers authenticate
-- via OTP and are scoped through the Edge Functions layer (service role),
-- not direct table access, so customer-facing RLS below is conservative.
-- ============================================================================

create or replace function auth_tenant_id()
returns uuid as $$
    select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id', '')::uuid;
$$ language sql stable;

create or replace function auth_staff_role()
returns staff_role as $$
    select (current_setting('request.jwt.claims', true)::jsonb ->> 'staff_role')::staff_role;
$$ language sql stable;

alter table tenants enable row level security;
alter table branches enable row level security;
alter table staff_users enable row level security;
alter table customers enable row level security;
alter table loyalty_cards enable row level security;
alter table card_lifecycle_events enable row level security;
alter table tiers enable row level security;
alter table points_ledger enable row level security;
alter table rewards enable row level security;
alter table redemptions enable row level security;
alter table pos_transactions enable row level security;
alter table campaigns enable row level security;
alter table audit_log enable row level security;

-- Generic tenant-isolation read policy, repeated per table
create policy tenant_isolation_select on branches for select using (tenant_id = auth_tenant_id());
create policy tenant_isolation_select on staff_users for select using (tenant_id = auth_tenant_id());
create policy tenant_isolation_select on customers for select using (tenant_id = auth_tenant_id());
create policy tenant_isolation_select on loyalty_cards for select using (tenant_id = auth_tenant_id());
create policy tenant_isolation_select on card_lifecycle_events for select using (tenant_id = auth_tenant_id());
create policy tenant_isolation_select on tiers for select using (tenant_id = auth_tenant_id());
create policy tenant_isolation_select on points_ledger for select using (tenant_id = auth_tenant_id());
create policy tenant_isolation_select on rewards for select using (tenant_id = auth_tenant_id());
create policy tenant_isolation_select on redemptions for select using (tenant_id = auth_tenant_id());
create policy tenant_isolation_select on pos_transactions for select using (tenant_id = auth_tenant_id());
create policy tenant_isolation_select on campaigns for select using (tenant_id = auth_tenant_id());
create policy tenant_isolation_select on audit_log for select using (tenant_id = auth_tenant_id());

-- Write policies: cashiers may write ledger/redemption rows within their own
-- branch; managers/admins/owners may also adjust and manage catalog/config.
create policy cashier_can_insert_ledger on points_ledger for insert
    with check (
        tenant_id = auth_tenant_id()
        and (auth_staff_role() in ('cashier','manager','admin','owner'))
    );

create policy only_manager_up_can_adjust on points_ledger for insert
    with check (
        txn_type <> 'adjustment'
        or auth_staff_role() in ('manager','admin','owner')
    );

create policy manager_up_manage_rewards on rewards for all
    using (tenant_id = auth_tenant_id() and auth_staff_role() in ('manager','admin','owner'))
    with check (tenant_id = auth_tenant_id() and auth_staff_role() in ('manager','admin','owner'));

create policy manager_up_manage_campaigns on campaigns for all
    using (tenant_id = auth_tenant_id() and auth_staff_role() in ('manager','admin','owner'))
    with check (tenant_id = auth_tenant_id() and auth_staff_role() in ('manager','admin','owner'));

create policy admin_up_manage_branches on branches for all
    using (tenant_id = auth_tenant_id() and auth_staff_role() in ('admin','owner'))
    with check (tenant_id = auth_tenant_id() and auth_staff_role() in ('admin','owner'));

create policy admin_up_manage_staff on staff_users for all
    using (tenant_id = auth_tenant_id() and auth_staff_role() in ('admin','owner'))
    with check (tenant_id = auth_tenant_id() and auth_staff_role() in ('admin','owner'));

-- Audit log: insert-only from server-side (Edge Functions using the service
-- role bypass RLS by design); no direct client update/delete policy exists,
-- which is intentional -- audit rows should be immutable from the API surface.
create policy audit_insert_service_only on audit_log for insert
    with check (tenant_id = auth_tenant_id());

-- ============================================================================
-- SEED EXAMPLE (adapt before running against a real environment)
-- ============================================================================

-- insert into tenants (name, slug) values ('Supermed Pharmacies', 'supermed');
--
-- insert into branches (tenant_id, name, address)
-- select id, 'Bulawayo CBD', 'Fife Street, Bulawayo' from tenants where slug = 'supermed';
--
-- insert into rewards (tenant_id, name, description, points_cost, reward_type, value)
-- select id, '$2 off your next purchase', 'Redeemable at any till', 200, 'discount_amount', 2.00
-- from tenants where slug = 'supermed';
