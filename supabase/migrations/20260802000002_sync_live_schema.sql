-- migration: sync_live_schema
-- Synchronizes live schema objects that drifted from git

-- 1. settings table
create table if not exists public.settings (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid not null,
    points_multiplier numeric not null default 1.0,
    currency text not null default 'USD',
    updated_at timestamptz not null default now()
);

alter table public.settings enable row level security;

drop policy if exists "System can manage settings" on public.settings;
create policy "System can manage settings" on public.settings for all using (true) with check (true);

drop policy if exists "Anyone can view settings" on public.settings;
create policy "Anyone can view settings" on public.settings for select using (true);


-- 2. idempotency_records table
create table if not exists public.idempotency_records (
    id uuid primary key default gen_random_uuid(),
    key text not null,
    response jsonb not null,
    created_at timestamptz not null default now(),
    expires_at timestamptz not null
);

alter table public.idempotency_records enable row level security;

drop policy if exists "System can insert idempotency records" on public.idempotency_records;
create policy "System can insert idempotency records" on public.idempotency_records for insert with check (true);

drop policy if exists "Anyone can check idempotency" on public.idempotency_records;
create policy "Anyone can check idempotency" on public.idempotency_records for select using (true);

-- 3. rls_auto_enable function and event trigger
CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;

DROP EVENT TRIGGER IF EXISTS ensure_rls;
CREATE EVENT TRIGGER ensure_rls ON ddl_command_end
   EXECUTE FUNCTION public.rls_auto_enable();
