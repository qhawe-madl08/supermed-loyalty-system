-- migration: custom_access_token_hook for tenant_id and role
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    claims jsonb;
    user_role public.staff_role;
    user_tenant_id uuid;
begin
    -- Look up the user in staff_users
    select role, tenant_id into user_role, user_tenant_id
    from public.staff_users
    where auth_user_id = (event->>'user_id')::uuid;

    claims := event->'claims';

    if user_role is not null then
        -- Inject the claims that auth_tenant_id() and auth_staff_role() expect
        claims := jsonb_set(claims, '{tenant_id}', to_jsonb(user_tenant_id));
        claims := jsonb_set(claims, '{staff_role}', to_jsonb(user_role));
    end if;

    -- Update the event with the new claims
    event := jsonb_set(event, '{claims}', claims);
    
    return event;
end;
$$;

-- Secure the hook: only the auth admin can execute it
revoke execute on function public.custom_access_token_hook(jsonb) from public;
revoke execute on function public.custom_access_token_hook(jsonb) from anon;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
