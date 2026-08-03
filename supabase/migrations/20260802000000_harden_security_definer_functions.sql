-- migration: harden_security_definer_functions
alter function public.fn_apply_ledger_to_balance() set search_path = public, pg_temp;
alter function public.fn_rebuild_customer_balance(uuid) set search_path = public, pg_temp;
alter function public.auth_tenant_id() set search_path = public, pg_temp;
alter function public.auth_staff_role() set search_path = public, pg_temp;

revoke execute on function public.fn_rebuild_customer_balance(uuid) from public;
grant execute on function public.fn_rebuild_customer_balance(uuid) to service_role;
