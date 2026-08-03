# SuperMed Loyalty System — Continuation Notes

## System State
- **Build**: ✅ Passing (last verified after Phase 4–6 fixes)
- **Database**: Live Supabase project `tutcfmdjnodplfslprbr` — all 15 core tables present, RLS enabled on all, 0 rows (clean slate)
- **Auth Hook**: ❌ Not yet enabled — `auth_tenant_id()` will return `NULL` for real sessions until the Custom Access Token Hook is enabled in the Supabase Dashboard

---

## Architecture Decisions

| Decision | Rationale |
|---|---|
| `supabaseAdmin` (service role) used in all server actions and repositories | RLS requires a working JWT `tenant_id` claim, which needs the auth hook first. Service role bypasses RLS safely during this bootstrapping phase. |
| Dynamic `tenant_id` via `tenant-helper.ts` | Fetches the first active tenant from DB — avoids hardcoded UUIDs, safe for single-tenant deployment. |
| Cards issued at enrollment (not from a pool) | DB enforces `loyalty_cards.customer_id NOT NULL`. Cards cannot pre-exist without an owner. |
| `getUserRole()` queries `staff_users` table | Role is authoritative in DB, not in JWT metadata. |

---

## Migration State

| File | Status |
|---|---|
| `20240101000000_initial_schema.sql` | Written to Git, applied out-of-band via SQL editor (NOT tracked in Supabase migration history) |
| `20260802000000_harden_security_definer_functions.sql` | ✅ Applied via Supabase MCP |
| `20260802000001_auth_hook.sql` | ✅ Applied via Supabase MCP |
| `20260802000002_sync_live_schema.sql` | ✅ Applied via Supabase MCP |

> Run `npx supabase db push` to formally track pending migrations without re-executing already-applied DDL.

---

### Fully Completed! 🎉
- The Custom Access Token Hook has been enabled.
- The bootstrap script was executed, initializing the first branch, tenant, and super admin.
- All live database migrations have been successfully pushed and applied.
- The backend architecture now relies exclusively on user-scoped Supabase clients and is completely secured by RLS!

---

## File Map (Key Files)

| Purpose | File |
|---|---|
| Dynamic tenant resolution | `src/lib/tenant-helper.ts` |
| Auth helpers (session, role) | `src/lib/auth.ts` |
| Customer CRUD | `src/services/customer/customer.repository.ts` |
| Card issuance & assignment | `src/services/cards/card.repository.ts` |
| Points ledger | `src/services/transactions/transaction.repository.ts` |
| Settings (points multiplier) | `src/services/settings/settings.repository.ts` |
| Idempotency | `src/services/idempotency/idempotency.repository.ts` |
| Enrollment server action | `src/app/actions/customer-actions.ts` |
| Transaction server action | `src/app/actions/transaction-actions.ts` |
| Bootstrap script | `scripts/bootstrap-super-admin.ts` |

---

## Media Assets

Located in `public/media/`:
- `logo.png` — used in `page.tsx` (landing), `login/page.tsx`, `dashboard/page.tsx`
- `hero-banner.png` — used in `page.tsx` (landing) as CSS background

All references use lowercase paths matching actual filenames (`/media/logo.png`, `/media/hero-banner.png`). Case is correct and consistent.

---

## Completed Phases

| Phase | Summary |
|---|---|
| 1 | Fixed client crash — removed `supabaseAdmin` from browser bundle, deleted dead `AuthProvider` |
| 2 | Removed duplicate migration file (`supermed_loyalty_schema.sql`) |
| 3 | Removed client-only auth layer; converged on cookie/middleware architecture |
| 4 | Swapped JSON persistence layer for Supabase repositories across all services |
| 5 | Bootstrap super-admin script created |
| 6 | Synced live schema drift to Git (settings, idempotency_records, rls_auto_enable) |
| Post-6 | Removed placeholder stubs (`transaction.service.ts`, `card.service.ts`), real staff ID resolution, real balance computation, production-grade card issuance flow |
| Post-6b | Switched all repositories from `supabaseAdmin` to `createSupabaseServerClient`; added `force-dynamic` to all authenticated pages |
| 7 | **RLS hardening** — comprehensive audit of all 15 tables; replaced all 23 prior policies with 42 tight, role-scoped, tenant-isolated policies via `20260803000000_secure_rls_policies.sql`. Fixed: missing write policies on `customers`, `loyalty_cards`, `card_lifecycle_events`, `tiers`; scoped `settings` and `idempotency_records` to authenticated users; removed open `audit_log` INSERT; merged conflicting `points_ledger` INSERT policies; added `tenants` SELECT policy. |
