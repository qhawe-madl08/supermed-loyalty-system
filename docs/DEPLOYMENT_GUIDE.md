# Deployment Guide

Nothing in this repository deploys itself. These are the manual steps.

## 1. Supabase project

1. Create a Supabase project (region closest to Zimbabwe, e.g. `eu-west`).
2. Link the CLI and apply the schema:
   ```bash
   supabase link --project-ref <project-ref>
   supabase db push
   ```
   Migrations are applied in filename order:
   - `20240101000000_initial_schema.sql` — tenants, branches, staff, customers,
     cards, points ledger, rewards, audit log, RLS policies.
   - `20260802120000_card_status_values.sql` — adds the `available`, `assigned`,
     and `disabled` card states (separate file because Postgres cannot use a new
     enum value in the transaction that creates it).
   - `20260802120100_card_inventory_and_settings.sql` — makes
     `loyalty_cards.customer_id` nullable and adds the `app_settings` table.
3. Seed the baseline rows:
   ```bash
   psql "$SUPABASE_DB_URL" -f supabase/seed.sql
   ```
   This creates the Supermed tenant `11111111-1111-1111-1111-111111111111`, five
   branches, default settings, and 20 example cards. Replace the card numbers
   with the real pre-printed ones before go-live.
4. Copy the project URL, anon key, and service-role key from
   Project Settings → API.

## 2. Vercel project

1. Import the repository into Vercel (framework preset: Next.js, no build
   overrides needed).
2. Set these environment variables for Preview and Production:

   | Variable | Value |
   |---|---|
   | `DATA_BACKEND` | `supabase` |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key (server-side only) |
   | `SUPERMED_TENANT_ID` | `11111111-1111-1111-1111-111111111111` |

   `DATA_BACKEND=json` must never be used on Vercel: the JSON store writes to the
   filesystem, which is read-only and ephemeral there.
3. Deploy, then check `https://<deployment>/api/v1/health` — it should report
   `"backend": "supabase"`.

## 3. Staff accounts

Create staff logins in Supabase Auth (Authentication → Users). Role-aware access
is not wired up yet; until it is, every authenticated user can reach the staff
workflows.

## Rollback

Redeploy the previous Vercel build. Database migrations are forward-only; the
rollback notes for each migration are in the file header.
