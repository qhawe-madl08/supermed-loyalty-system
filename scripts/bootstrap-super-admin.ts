// scripts/bootstrap-super-admin.ts
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function bootstrap() {
  // Guard: refuse to run if an owner already exists
  const { data: existingOwner } = await supabase
    .from('staff_users')
    .select('id')
    .eq('role', 'owner')
    .maybeSingle();

  if (existingOwner) {
    console.error('Bootstrap aborted: an owner-role staff user already exists.');
    process.exit(1);
  }

  const { data: tenant, error: tenantErr } = await supabase
    .from('tenants')
    .insert({ name: 'Supermed Pharmacies', slug: 'supermed-pharmacies', default_currency: 'USD' })
    .select().single();
  if (tenantErr) throw tenantErr;

  const { data: branch, error: branchErr } = await supabase
    .from('branches')
    .insert({ tenant_id: tenant.id, name: 'Bulawayo CBD' })
    .select().single();
  if (branchErr) throw branchErr;

  const email = process.env.BOOTSTRAP_ADMIN_EMAIL!;      // supplied at run time, not hardcoded
  const password = randomBytes(18).toString('base64url'); // random, printed once, never logged elsewhere

  const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (authErr) throw authErr;

  const { error: staffErr } = await supabase.from('staff_users').insert({
    tenant_id: tenant.id,
    branch_id: branch.id,
    auth_user_id: authUser.user.id,
    full_name: 'Super Admin',
    role: 'owner', // matches live staff_role enum — NOT 'SUPER_ADMIN'
    is_active: true,
  });
  if (staffErr) throw staffErr;

  console.log(`Created. Email: ${email}  Temporary password: ${password}`);
  console.log('Store this password now — it will not be shown again.');
}

bootstrap();
