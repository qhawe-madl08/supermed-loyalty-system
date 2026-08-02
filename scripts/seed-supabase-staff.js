require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'found' : 'missing');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'found' : 'missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedStaffUsers() {
  console.log('Starting Supabase staff users seeding...');

  try {
    // Create default tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: 'Supermed Pharmacies',
        slug: 'supermed-pharmacies',
        default_currency: 'USD',
        timezone: 'Africa/Harare',
        branding: JSON.stringify({ logo: 'S', primaryColor: '#2563EB' }),
        is_active: true,
      })
      .select()
      .single();

    if (tenantError) {
      console.error('Error creating tenant:', tenantError);
      return;
    }

    console.log('Tenant created:', tenant.id);

    // Create default branch
    const { data: branch, error: branchError } = await supabase
      .from('branches')
      .insert({
        tenant_id: tenant.id,
        name: 'Main Branch - Bulawayo',
        address: '123 Main Street, Bulawayo, Zimbabwe',
        phone: '+263 29 1234567',
        timezone: 'Africa/Harare',
        is_active: true,
      })
      .select()
      .single();

    if (branchError) {
      console.error('Error creating branch:', branchError);
      return;
    }

    console.log('Branch created:', branch.id);

    // Create Supabase Auth users and staff records
    // Branch login model: One staff login per branch for now
    const staffUsers = [
      {
        tenant_id: tenant.id,
        branch_id: branch.id,
        auth_user_id: '', // Will be filled after auth user creation
        full_name: 'Super Admin',
        role: 'SUPER_ADMIN',
        pin_hash: 'hashed_pin_1234',
        is_active: true,
      },
      {
        tenant_id: tenant.id,
        branch_id: branch.id,
        auth_user_id: '',
        full_name: 'Bulawayo Branch Manager',
        role: 'BRANCH_MANAGER',
        pin_hash: 'hashed_pin_5678',
        is_active: true,
      },
    ];

    for (const staffUser of staffUsers) {
      // Create auth user
      // Use role-based email for branch login model
      let email;
      if (staffUser.role === 'SUPER_ADMIN') {
        email = 'admin@supermed.co.zw';
      } else if (staffUser.role === 'BRANCH_MANAGER') {
        email = 'bulawayo.manager@supermed.co.zw';
      } else {
        email = `${staffUser.full_name.toLowerCase().replace(' ', '.')}@supermed.co.zw`;
      }
      const password = 'tempPassword123!';

      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: staffUser.full_name,
          role: staffUser.role,
        },
      });

      if (authError) {
        console.error(`Error creating auth user for ${staffUser.full_name}:`, authError);
        continue;
      }

      console.log(`Auth user created for ${staffUser.full_name}:`, authUser.user.id);

      // Create staff user record
      const { data: staffData, error: staffError } = await supabase
        .from('staff_users')
        .insert({
          ...staffUser,
          auth_user_id: authUser.user.id,
        })
        .select()
        .single();

      if (staffError) {
        console.error(`Error creating staff user for ${staffUser.full_name}:`, staffError);
        continue;
      }

      console.log(`Staff user created for ${staffUser.full_name}:`, staffData.id);
      console.log(`  Email: ${email}`);
      console.log(`  Password: ${password}`);
    }

    console.log('Supabase staff users seeding completed successfully!');
  } catch (error) {
    console.error('Error during seeding:', error);
  }
}

seedStaffUsers();