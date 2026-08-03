-- =====================================================================
-- Supermed Loyalty System
-- Migration: 20260803000000_secure_rls_policies.sql
--
-- Replaces all existing policies with tight, role-scoped, tenant-isolated
-- policies. Drops every existing policy first, then creates clean set.
--
-- Design principles:
--   1. Deny by default — if no policy matches, the row is blocked.
--   2. Tenant isolation always — every policy checks auth_tenant_id().
--   3. Role-scoped writes — all mutations require a valid staff JWT claim.
--   4. Append-only ledger — points_ledger has no UPDATE/DELETE policies.
--   5. audit_log INSERT is service-role only (supabaseAdmin bypasses RLS).
-- =====================================================================


-- -----------------------------------------------------------------------
-- TENANTS (read-only for own tenant; no user-facing writes)
-- -----------------------------------------------------------------------
-- No existing policy to drop (zero policies on tenants previously).
create policy "staff_can_read_own_tenant" on tenants
  for select
  using (id = auth_tenant_id());


-- -----------------------------------------------------------------------
-- BRANCHES
-- -----------------------------------------------------------------------
drop policy if exists "tenant_isolation_select" on branches;
drop policy if exists "admin_up_manage_branches" on branches;

create policy "staff_can_read_branches" on branches
  for select
  using (tenant_id = auth_tenant_id());

create policy "admin_up_can_insert_branch" on branches
  for insert
  with check (
    tenant_id = auth_tenant_id()
    and auth_staff_role() in ('admin', 'owner')
  );

create policy "admin_up_can_update_branch" on branches
  for update
  using (tenant_id = auth_tenant_id() and auth_staff_role() in ('admin', 'owner'))
  with check (tenant_id = auth_tenant_id() and auth_staff_role() in ('admin', 'owner'));

create policy "owner_can_delete_branch" on branches
  for delete
  using (tenant_id = auth_tenant_id() and auth_staff_role() = 'owner');


-- -----------------------------------------------------------------------
-- STAFF_USERS
-- Separate SELECT + granular write policies to avoid the ALL-vs-SELECT
-- overlap between the former tenant_isolation_select and admin_up_manage_staff.
-- -----------------------------------------------------------------------
drop policy if exists "tenant_isolation_select" on staff_users;
drop policy if exists "admin_up_manage_staff" on staff_users;

create policy "staff_can_read_colleagues" on staff_users
  for select
  using (tenant_id = auth_tenant_id());

create policy "admin_up_can_insert_staff" on staff_users
  for insert
  with check (
    tenant_id = auth_tenant_id()
    and auth_staff_role() in ('admin', 'owner')
  );

create policy "admin_up_can_update_staff" on staff_users
  for update
  using (tenant_id = auth_tenant_id() and auth_staff_role() in ('admin', 'owner'))
  with check (tenant_id = auth_tenant_id() and auth_staff_role() in ('admin', 'owner'));

create policy "owner_can_delete_staff" on staff_users
  for delete
  using (tenant_id = auth_tenant_id() and auth_staff_role() = 'owner');


-- -----------------------------------------------------------------------
-- TIERS
-- -----------------------------------------------------------------------
drop policy if exists "tenant_isolation_select" on tiers;

create policy "staff_can_read_tiers" on tiers
  for select
  using (tenant_id = auth_tenant_id());

create policy "manager_up_can_insert_tier" on tiers
  for insert
  with check (
    tenant_id = auth_tenant_id()
    and auth_staff_role() in ('manager', 'admin', 'owner')
  );

create policy "manager_up_can_update_tier" on tiers
  for update
  using (tenant_id = auth_tenant_id() and auth_staff_role() in ('manager', 'admin', 'owner'))
  with check (tenant_id = auth_tenant_id() and auth_staff_role() in ('manager', 'admin', 'owner'));

create policy "admin_up_can_delete_tier" on tiers
  for delete
  using (tenant_id = auth_tenant_id() and auth_staff_role() in ('admin', 'owner'));


-- -----------------------------------------------------------------------
-- CUSTOMERS
-- -----------------------------------------------------------------------
drop policy if exists "tenant_isolation_select" on customers;

create policy "staff_can_read_customers" on customers
  for select
  using (tenant_id = auth_tenant_id());

create policy "cashier_up_can_insert_customer" on customers
  for insert
  with check (
    tenant_id = auth_tenant_id()
    and auth_staff_role() in ('cashier', 'manager', 'admin', 'owner')
  );

create policy "manager_up_can_update_customer" on customers
  for update
  using (tenant_id = auth_tenant_id() and auth_staff_role() in ('manager', 'admin', 'owner'))
  with check (tenant_id = auth_tenant_id() and auth_staff_role() in ('manager', 'admin', 'owner'));

create policy "owner_can_delete_customer" on customers
  for delete
  using (tenant_id = auth_tenant_id() and auth_staff_role() = 'owner');


-- -----------------------------------------------------------------------
-- LOYALTY_CARDS
-- -----------------------------------------------------------------------
drop policy if exists "tenant_isolation_select" on loyalty_cards;

create policy "staff_can_read_loyalty_cards" on loyalty_cards
  for select
  using (tenant_id = auth_tenant_id());

create policy "cashier_up_can_insert_card" on loyalty_cards
  for insert
  with check (
    tenant_id = auth_tenant_id()
    and auth_staff_role() in ('cashier', 'manager', 'admin', 'owner')
  );

create policy "cashier_up_can_update_card" on loyalty_cards
  for update
  using (tenant_id = auth_tenant_id() and auth_staff_role() in ('cashier', 'manager', 'admin', 'owner'))
  with check (tenant_id = auth_tenant_id() and auth_staff_role() in ('cashier', 'manager', 'admin', 'owner'));

create policy "admin_up_can_delete_card" on loyalty_cards
  for delete
  using (tenant_id = auth_tenant_id() and auth_staff_role() in ('admin', 'owner'));


-- -----------------------------------------------------------------------
-- CARD_LIFECYCLE_EVENTS (append-only — no UPDATE or DELETE policy)
-- -----------------------------------------------------------------------
drop policy if exists "tenant_isolation_select" on card_lifecycle_events;

create policy "staff_can_read_card_events" on card_lifecycle_events
  for select
  using (tenant_id = auth_tenant_id());

create policy "cashier_up_can_insert_card_event" on card_lifecycle_events
  for insert
  with check (
    tenant_id = auth_tenant_id()
    and auth_staff_role() in ('cashier', 'manager', 'admin', 'owner')
  );


-- -----------------------------------------------------------------------
-- POINTS_LEDGER (append-only)
-- The former two PERMISSIVE INSERT policies (cashier_can_insert_ledger and
-- only_manager_up_can_adjust) used OR logic, making the adjustment
-- restriction ineffective. Merged into one policy with explicit txn_type
-- branching so the intent is unambiguous.
-- -----------------------------------------------------------------------
drop policy if exists "tenant_isolation_select" on points_ledger;
drop policy if exists "cashier_can_insert_ledger" on points_ledger;
drop policy if exists "only_manager_up_can_adjust" on points_ledger;

create policy "staff_can_read_ledger" on points_ledger
  for select
  using (tenant_id = auth_tenant_id());

create policy "staff_can_insert_ledger" on points_ledger
  for insert
  with check (
    tenant_id = auth_tenant_id()
    and auth_staff_role() is not null
    and (
      -- earn, redeem, refund_reversal: any staff
      txn_type in ('earn', 'redeem', 'refund_reversal')
      -- adjustment / expiry: manager and above only
      or (
        txn_type in ('adjustment', 'expiry')
        and auth_staff_role() in ('manager', 'admin', 'owner')
      )
    )
  );


-- -----------------------------------------------------------------------
-- REWARDS
-- -----------------------------------------------------------------------
drop policy if exists "tenant_isolation_select" on rewards;
drop policy if exists "manager_up_manage_rewards" on rewards;

create policy "staff_can_read_rewards" on rewards
  for select
  using (tenant_id = auth_tenant_id());

create policy "manager_up_can_insert_reward" on rewards
  for insert
  with check (
    tenant_id = auth_tenant_id()
    and auth_staff_role() in ('manager', 'admin', 'owner')
  );

create policy "manager_up_can_update_reward" on rewards
  for update
  using (tenant_id = auth_tenant_id() and auth_staff_role() in ('manager', 'admin', 'owner'))
  with check (tenant_id = auth_tenant_id() and auth_staff_role() in ('manager', 'admin', 'owner'));

create policy "admin_up_can_delete_reward" on rewards
  for delete
  using (tenant_id = auth_tenant_id() and auth_staff_role() in ('admin', 'owner'));


-- -----------------------------------------------------------------------
-- REDEMPTIONS (append-only by cashier+)
-- -----------------------------------------------------------------------
drop policy if exists "tenant_isolation_select" on redemptions;

create policy "staff_can_read_redemptions" on redemptions
  for select
  using (tenant_id = auth_tenant_id());

create policy "cashier_up_can_insert_redemption" on redemptions
  for insert
  with check (
    tenant_id = auth_tenant_id()
    and auth_staff_role() in ('cashier', 'manager', 'admin', 'owner')
  );


-- -----------------------------------------------------------------------
-- CAMPAIGNS
-- -----------------------------------------------------------------------
drop policy if exists "tenant_isolation_select" on campaigns;
drop policy if exists "manager_up_manage_campaigns" on campaigns;

create policy "staff_can_read_campaigns" on campaigns
  for select
  using (tenant_id = auth_tenant_id());

create policy "manager_up_can_insert_campaign" on campaigns
  for insert
  with check (
    tenant_id = auth_tenant_id()
    and auth_staff_role() in ('manager', 'admin', 'owner')
  );

create policy "manager_up_can_update_campaign" on campaigns
  for update
  using (tenant_id = auth_tenant_id() and auth_staff_role() in ('manager', 'admin', 'owner'))
  with check (tenant_id = auth_tenant_id() and auth_staff_role() in ('manager', 'admin', 'owner'));

create policy "admin_up_can_delete_campaign" on campaigns
  for delete
  using (tenant_id = auth_tenant_id() and auth_staff_role() in ('admin', 'owner'));


-- -----------------------------------------------------------------------
-- POS_TRANSACTIONS (append-only; visibility restricted to manager+)
-- -----------------------------------------------------------------------
drop policy if exists "tenant_isolation_select" on pos_transactions;

create policy "manager_up_can_read_pos_txns" on pos_transactions
  for select
  using (tenant_id = auth_tenant_id() and auth_staff_role() in ('manager', 'admin', 'owner'));

create policy "cashier_up_can_insert_pos_txn" on pos_transactions
  for insert
  with check (
    tenant_id = auth_tenant_id()
    and auth_staff_role() in ('cashier', 'manager', 'admin', 'owner')
  );


-- -----------------------------------------------------------------------
-- SETTINGS (tenant-scoped; owner-only writes)
-- Replaces the formerly open "true" policies.
-- -----------------------------------------------------------------------
drop policy if exists "Anyone can view settings" on settings;
drop policy if exists "System can manage settings" on settings;

create policy "staff_can_read_settings" on settings
  for select
  using (tenant_id = auth_tenant_id());

create policy "owner_can_insert_settings" on settings
  for insert
  with check (
    tenant_id = auth_tenant_id()
    and auth_staff_role() = 'owner'
  );

create policy "owner_can_update_settings" on settings
  for update
  using (tenant_id = auth_tenant_id() and auth_staff_role() = 'owner')
  with check (tenant_id = auth_tenant_id() and auth_staff_role() = 'owner');


-- -----------------------------------------------------------------------
-- IDEMPOTENCY_RECORDS
-- No tenant_id column exists, so scope to `authenticated` role only.
-- The service role (supabaseAdmin) bypasses RLS and always has access.
-- Replaces the formerly open `true` policies.
-- -----------------------------------------------------------------------
drop policy if exists "Anyone can check idempotency" on idempotency_records;
drop policy if exists "System can insert idempotency records" on idempotency_records;

create policy "authenticated_can_read_idempotency" on idempotency_records
  for select
  to authenticated
  using (true);

create policy "authenticated_can_insert_idempotency" on idempotency_records
  for insert
  to authenticated
  with check (true);


-- -----------------------------------------------------------------------
-- AUDIT_LOG
-- INSERT policy removed from user-scoped surface entirely.
-- All audit writes go through supabaseAdmin (service role bypasses RLS).
-- SELECT restricted to admin and owner roles only.
-- -----------------------------------------------------------------------
drop policy if exists "audit_insert_service_only" on audit_log;
drop policy if exists "tenant_isolation_select" on audit_log;

create policy "admin_up_can_read_audit_log" on audit_log
  for select
  using (tenant_id = auth_tenant_id() and auth_staff_role() in ('admin', 'owner'));
