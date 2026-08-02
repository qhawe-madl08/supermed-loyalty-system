# Supermed Loyalty System - Super Admin Setup Guide

## Overview
This guide provides step-by-step instructions for the Super Admin to set up the Supermed Loyalty System for production use.

## Pre-Setup Requirements

### 1. Supabase Project Configuration
- Ensure Supabase project `supermed-loyalty` is active and healthy
- Verify all database tables are deployed
- Confirm RLS policies are configured

### 2. Environment Variables
Update `.env.local` with production Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://tutcfmdjnodplfslprbr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-production-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-production-service-role-key>
SUPABASE_DB_PASSWORD=<your-production-db-password>
JWT_SECRET=<strong-random-secret-key>
NODE_ENV=production
NEXT_PUBLIC_DEFAULT_TENANT_ID=<tenant-id-created-in-step-3>
```

## Initial Setup Process

### Step 1: Run Staff User Seeder
```bash
npm run seed:supabase
```

This will create:
- **Default Tenant:** Supermed Pharmacies
- **Default Branch:** Main Branch - Bulawayo
- **Staff Users:**
  - Super Admin (super.admin@supermed.co.zw)
  - Branch Manager (branch.manager@supermed.co.zw)
  - Cashier One (cashier.one@supermed.co.zw)

**Important:** Note the temporary passwords displayed in the console. These will need to be changed after first login.

### Step 2: Initial Super Admin Login
1. Navigate to the application URL
2. Login with Super Admin credentials from Step 1
3. Change password immediately after first login
4. Verify all system functions are accessible

### Step 3: Branch Configuration
As Super Admin, configure additional branches:

1. **Create Branch Records**
   - Navigate to Admin → Branches (when implemented)
   - Add branch details for each location
   - Assign unique branch identifiers

2. **Configure Branch-Specific Settings**
   - Set branch timezones
   - Configure local contact information
   - Assign default staff roles per branch

### Step 4: Staff Account Management

#### Current Branch Login Model
For initial deployment, use **one staff login per branch**:

1. **Branch Manager Account** (per branch)
   - One Branch Manager login per location
   - Can manage all operations for that branch
   - Can create/view Cashier accounts for their branch

2. **Cashier Accounts** (per branch)
   - Created by Branch Manager
   - Limited to transaction recording
   - Cannot access admin functions

#### Role Assignment Process
**IMPORTANT:** Staff members cannot self-assign roles. The hierarchy is:

1. **Super Admin** (System-level)
   - Can create Branch Manager accounts
   - Can assign Branch Manager roles
   - Can access all branches and data

2. **Branch Manager** (Branch-level)
   - Can create Cashier accounts for their branch only
   - Can assign Cashier roles for their branch only
   - Can only access their branch's data

3. **Cashier** (Transaction-level)
   - Cannot create or assign any roles
   - Can only record transactions
   - Can only view customer data they interact with

### Step 5: Role Allocation Security

**Security Implementation:**
- Role assignment is restricted by database RLS policies
- Only users with appropriate permissions can create/assign roles
- Self-service role selection is **not allowed**
- All role changes are logged in the audit system

**Example Role Assignment Flow:**
```
Super Admin (system) → Creates Branch Manager account → Assigns BRANCH_MANAGER role
Branch Manager (branch) → Creates Cashier account → Assigns CASHIER role
Cashier → Cannot create or assign any roles
```

### Step 6: Asset Upload
1. Upload logo to `public/media/logo.png`
2. Upload hero banner to `public/media/hero-banner.jpg`
3. Upload additional imagery to `public/media/` as needed
4. Images should be optimized for web (under 500KB each)

### Step 7: System Validation
1. Test login for each role level
2. Verify branch isolation (Branch Manager cannot see other branches)
3. Test audit logging is working
4. Verify transaction idempotency
5. Test error handling and user feedback

## Branch Scaling Strategy

### Phase 1: Single Login Per Branch (Current)
- One Branch Manager login per branch
- Branch Manager handles all operations
- Simple, minimal account management

### Phase 2: Individual Staff Accounts (Future)
- Each staff member gets individual login
- Branch Manager creates and manages staff accounts
- Enhanced audit trail with individual accountability
- Requires staff user management interface

### Phase 3: Multi-Tenant (Future)
- Separate database tenants for different pharmacy chains
- Each tenant has its own Super Admin
- Complete data isolation between chains
- Requires multi-tenant architecture enhancements

## Security Guidelines

### Password Requirements
- Minimum 12 characters
- Mix of uppercase, lowercase, numbers, and special characters
- Force password change on first login
- Regular password rotation (90 days recommended)

### Access Control
- Use principle of least privilege
- Regularly review access logs
- Immediately revoke access for terminated staff
- Implement session timeout (30 minutes recommended)

### Audit Monitoring
- Regular review of audit logs
- Monitor for unusual activity patterns
- Investigate failed login attempts
- Track role assignment changes

## Troubleshooting

### Login Issues
- **Problem:** Staff cannot login
- **Solution:** Verify account exists in staff_users table, check role assignment, confirm account is active

### Branch Access Issues
- **Problem:** Branch Manager cannot see their branch data
- **Solution:** Verify branch_id assignment, check RLS policies, confirm tenant association

### Role Assignment Issues
- **Problem:** User cannot assign roles
- **Solution:** Verify user has appropriate permissions, check RLS policies, confirm role hierarchy

## Maintenance

### Regular Tasks
- Review and rotate admin passwords
- Monitor user access and revoke unnecessary permissions
- Update system documentation as changes are made
- Review audit logs for security issues

### Updates
- Test updates in staging environment first
- Backup database before major updates
- Notify staff of system changes
- Monitor for issues after deployment

## Support Contacts
- **Technical Support:** tech@supermed.co.zw
- **System Admin:** admin@supermed.co.zw
- **Business Support:** info@supermed.co.zw