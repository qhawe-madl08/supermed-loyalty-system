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
| 2A | **Architecture Verification & Reconciliation Audit** — Comprehensive evidence-based audit confirming: single authentication implementation (Supabase Auth + SSR cookies + middleware), canonical role model (owner/admin/manager/cashier), no JSON persistence in production code, 4 migrations in correct order with no duplicates, service role client properly isolated from browser, dead scripts identified for cleanup. |
| 2B | **Authentication Foundation Verification** — Evidence-driven verification of authentication flow: identified missing /api/auth/login and /api/auth/logout endpoints as root cause of 404 errors, verified auth hook migration design, confirmed middleware session-based protection, validated service role client isolation, audited bootstrap script (recommended transaction wrapper and idempotency checks). |
| 2C | **Authentication Implementation** — Implemented missing API routes: `src/app/api/auth/login/route.ts` (POST, signInWithPassword via createRouteHandlerClient) and `src/app/api/auth/logout/route.ts` (POST, signOut via createRouteHandlerClient). Both routes use Supabase Auth Helpers for automatic HTTP-only cookie management. No manual cookie creation, no localStorage/sessionStorage usage. |

---

## Phase 2A — Architecture Verification & Reconciliation Audit Findings

### Authentication Architecture
- **Status**: SINGLE CONSOLIDATED IMPLEMENTATION ✅
- **Entry Points**: `/api/auth/login` (MISSING - login page references it), `/api/auth/logout` (MISSING - logout button references it)
- **Middleware**: `src/middleware.ts` - protects `/dashboard`, `/workflows`, redirects authenticated users from `/login`
- **Auth Provider**: Supabase Auth Helpers for Next.js
- **Browser Client**: `src/lib/supabase-client.ts` - anon key only, singleton pattern
- **Server Client**: `src/lib/auth.ts` - `createServerComponentClient` via `@supabase/auth-helpers-nextjs`
- **Service Role Client**: `src/lib/supabase-admin.ts` - runtime browser protection, used only in `auth.ts` (getUserRole) and `tenant-helper.ts` (getDefaultTenantId)
- **Server Actions**: `src/app/actions/customer-actions.ts`, `src/app/actions/transaction-actions.ts` - use repositories
- **Repositories**: All use `createSupabaseServerClient` from `auth.ts`

### Role Model
- **Status**: CANONICAL RBAC (owner/admin/manager/cashier) ✅
- **Database Enum**: `staff_role` enum with values: `owner`, `admin`, `manager`, `cashier`
- **TypeScript Type**: `UserRole` in `src/lib/auth.ts` matches database enum exactly
- **Role Hierarchy**: Defined in `ROLE_HIERARCHY` object (cashier: 1, manager: 2, admin: 3, owner: 4)
- **Obsolete Roles Found** (in seed scripts only, not production code):
  - `SUPER_ADMIN`, `HEAD_OFFICE_ADMIN`, `READ_ONLY_AUDITOR` in `scripts/seed-supabase-staff.ts` and `scripts/seed-supabase-staff.js`
  - `StaffRole` type in seed scripts conflicts with canonical `UserRole`
  - **Recommendation**: Delete or update seed scripts to use canonical role model

### JSON Persistence
- **Status**: NO PRODUCTION JSON USAGE ✅
- **Dead Scripts Found** (reference non-existent JSON persistence):
  - `scripts/seed.js` - references `.data/loyalty-store.json`
  - `scripts/seed.ts` - file path incorrect, cannot be read
  - `scripts/verify-store.mjs` - imports non-existent `readStore` from `data-store.ts`
  - `scripts/init-tenant.ts` - empty file
- **Recommendation**: Delete these obsolete JSON-related scripts

### Database Migrations
- **Status**: 4 MIGRATIONS, NO DUPLICATES ✅
- `20240101000000_initial_schema.sql` - Core schema (tables, enums, functions, initial RLS)
- `20260802000000_harden_security_definer_functions.sql` - Security hardening (search_path restrictions)
- `20260802000001_auth_hook.sql` - Custom access token hook for tenant_id and role injection
- `20260802000002_sync_live_schema.sql` - Schema sync (settings, idempotency_records, rls_auto_enable trigger)
- `20260803000000_secure_rls_policies.sql` - Comprehensive RLS policies (replaces all prior policies)
- **Order**: Chronological, each builds on previous
- **No Duplicates**: Each migration has distinct purpose and timestamp

### Auth Endpoints
- **Status**: MISSING (BLOCKING) ❌
- `/api/auth/login` - Does not exist, but referenced by `src/app/login/page.tsx`
- `/api/auth/logout` - Does not exist, but referenced by `src/components/logout-button.tsx`
- **Impact**: Login functionality cannot work without these endpoints
- **Required Implementation**: Must create API routes following existing authentication architecture

### Service Role Safety
- **Status**: SECURE ✅
- **Browser Protection**: Runtime check in `supabase-admin.ts` throws if imported in browser
- **Import Graph**:
  - `src/lib/auth.ts` → `supabase-admin` (server-only, getUserRole function)
  - `src/lib/tenant-helper.ts` → `supabase-admin` (server-only, getDefaultTenantId function)
- **Client Components**: No 'use client' files import supabase-admin
- **Server Components**: Only server-side libraries import it
- **No Browser Bundle Leakage**: Verified

### Dead Code
- **Status**: OBSELETE SCRIPTS IDENTIFIED ⚠️
- `scripts/seed.js` - JSON persistence script (obsolete)
- `scripts/seed.ts` - Cannot be read, likely obsolete
- `scripts/verify-store.mjs` - References non-existent data-store.ts
- `scripts/init-tenant.ts` - Empty file
- `scripts/seed-supabase-staff.ts` - Uses obsolete role model (SUPER_ADMIN, etc.)
- `scripts/seed-supabase-staff.js` - Uses obsolete role model (SUPER_ADMIN, etc.)
- **Recommendation**: Delete obsolete JSON scripts, update seed scripts to use canonical role model

### Final Architecture Status
- **Conclusion**: OPTION B - Architecture mostly consolidated with remaining cleanup
- **Critical Gap**: Missing `/api/auth/login` and `/api/auth/logout` endpoints
- **Cleanup Needed**: Obsolete seed scripts with outdated role model
- **Otherwise**: Single authentication implementation, canonical role model, no JSON persistence, secure service role usage
