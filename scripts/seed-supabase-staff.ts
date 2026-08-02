import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

type StaffRole = 'SUPER_ADMIN' | 'HEAD_OFFICE_ADMIN' | 'BRANCH_MANAGER' | 'CASHIER' | 'READ_ONLY_AUDITOR';

interface StaffUser {
  id: string;
  tenant_id: string;
  branch_id: string | null;
  auth_user_id: string;
  full_name: string;
  role: StaffRole;
  pin_hash: string;
  is_active: boolean;
}

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
        branding: { logo: 'S', primaryColor: '#2563EB' },
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
    const staffUsers: Omit<StaffUser, 'id'>[] = [
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
        full_name: 'Branch Manager',
        role: 'BRANCH_MANAGER',
        pin_hash: 'hashed_pin_5678',
        is_active: true,
      },
      {
        tenant_id: tenant.id,
        branch_id: branch.id,
        auth_user_id: '',
        full_name: 'Cashier One',
        role: 'CASHIER',
        pin_hash: 'hashed_pin_9012',
        is_active: true,
      },
    ];

    for (const staffUser of staffUsers) {
      // Create auth user
      const email = `${staffUser.full_name.toLowerCase().replace(' ', '.')}@supermed.co.zw`;
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