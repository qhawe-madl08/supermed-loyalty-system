# Supabase Migration Checklist

## Environment Status (Updated: 2026-08-02)

### Connected Services
- ✅ **Supabase MCP**: Connected and authenticated
- ✅ **Supabase Project**: `supermed-loyalty` (ID: `tutcfmdjnodplfslprbr`)
- ✅ **Project Status**: ACTIVE_HEALTHY
- ✅ **Region**: eu-west-1
- ✅ **Database**: PostgreSQL 17.6.1.155
- ⚠️ **GitHub MCP**: Connection failing
- ⚠️ **Vercel MCP**: Not configured

### Supabase Schema Status
**Tables Currently Deployed:**
- ✅ public.tenants (RLS enabled, 0 rows)
- ✅ public.branches (RLS enabled, 0 rows)
- ✅ public.staff_users (RLS enabled, 0 rows)
- ✅ public.tiers (RLS enabled, 0 rows)
- ✅ public.customers (RLS enabled, 0 rows)
- ✅ public.loyalty_cards (RLS enabled, 0 rows)
- ✅ public.card_lifecycle_events (RLS enabled, 0 rows)
- ✅ public.points_ledger (RLS enabled, 0 rows)
- ✅ public.rewards (RLS enabled, 0 rows)
- ✅ public.redemptions (RLS enabled, 0 rows)
- ✅ public.pos_transactions (RLS enabled, 0 rows)
- ✅ public.campaigns (RLS enabled, 0 rows)
- ✅ public.audit_log (RLS enabled, 0 rows)

**Missing Tables (Required for JSON backend features):**
- ❌ idempotency_records (for transaction idempotency)
- ❌ settings (for tenant-level configuration)

## Overview
This document provides a comprehensive readiness review for migrating the Supermed Loyalty System from the current JSON backend to Supabase.

## Current Architecture Analysis

### Repository Pattern Implementation
The codebase follows a clean repository pattern with backend abstraction:

```
src/lib/
├── data-store.ts                    # JSON backend implementation
├── action-response.ts               # NEW: Structured error handling
├── audit-logger.ts                  # NEW: Audit logging foundation
└── idempotency.ts                   # NEW: Transaction idempotency protection

src/services/
├── customer/
│   ├── customer.repository.ts       # Supabase backend implementation
│   └── customer.repository.json.ts  # JSON backend implementation (NEW)
├── transactions/
│   ├── transaction.repository.ts    # Supabase backend implementation
│   └── transaction.repository.json.ts # JSON backend implementation (NEW)
├── cards/
│   ├── card.repository.ts           # Supabase backend implementation
│   └── card.repository.json.ts       # JSON backend implementation (NEW)
└── loyalty/
    └── points.service.ts            # Business logic (backend-agnostic)
```

### Current Implementation Status
- ✅ JSON backend fully implemented and operational
- ✅ Supabase backend stubs exist but not actively used
- ✅ Clean separation between business logic and data access
- ✅ Repository interface pattern established
- ✅ Supabase project is live and schema is deployed

## Required Database Tables

### Core Tables (Already Deployed)
The following tables are already deployed in the Supabase project:

1. **tenants** - Multi-tenant support
   - Required columns: id, name, slug, default_currency, timezone, branding, is_active
   - Status: ✅ Deployed with RLS enabled

2. **branches** - Physical store locations
   - Required columns: id, tenant_id, name, address, phone, timezone, is_active
   - Status: ✅ Deployed with RLS enabled

3. **staff_users** - Staff accounts linked to auth.users
   - Required columns: id, tenant_id, branch_id, auth_user_id, full_name, role, pin_hash, is_active
   - Status: ✅ Deployed with RLS enabled

4. **customers** - Customer records
   - Required columns: id, tenant_id, full_name, phone_e164, email, points_balance, preferred_channel, is_active
   - Status: ✅ Deployed with RLS enabled

5. **loyalty_cards** - Physical/virtual loyalty cards
   - Required columns: id, tenant_id, customer_id, card_code, card_type, status, issued_at
   - Status: ✅ Deployed with RLS enabled

6. **points_ledger** - Append-only transaction ledger
   - Required columns: id, tenant_id, customer_id, txn_type, points, amount, idempotency_key
   - Status: ✅ Deployed with RLS enabled

### Additional Tables Required for New Features

7. **audit_log** - Audit trail (✅ Already deployed)
   - Status: ✅ Deployed with RLS enabled, 0 rows
   - Note: Table exists but needs to be populated via application logic

8. **idempotency_records** - Transaction idempotency (❌ Missing)
   ```sql
   CREATE TABLE idempotency_records (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     key TEXT NOT NULL UNIQUE,
     response JSONB NOT NULL,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
     expires_at TIMESTAMPTZ NOT NULL
   );
   CREATE INDEX idx_idempotency_key ON idempotency_records(key);
   CREATE INDEX idx_idempotency_expiry ON idempotency_records(expires_at);
   ```

9. **settings** - Tenant-level configuration (❌ Missing)
   ```sql
   CREATE TABLE settings (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
     points_multiplier NUMERIC(10,2) NOT NULL DEFAULT 1.0,
     currency TEXT NOT NULL DEFAULT 'USD',
     updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
     UNIQUE (tenant_id)
   );
   ```

## Schema Migration Requirements

### Missing Schema Assumptions

1. **Customer Name Split**
   - Current JSON: `first_name`, `last_name` (separate fields)
   - Supabase schema: `full_name` (single field)
   - Migration strategy: Concatenate first_name + last_name during migration
   - UI impact: Need to update UI to display full_name as single field or split on display

2. **Card Assignment Logic**
   - Current JSON: Cards have `assigned_customer_id` field
   - Supabase schema: Cards have `customer_id` field (direct foreign key)
   - Migration strategy: Direct mapping, but need to handle null vs placeholder logic

3. **Transaction Balance Calculation**
   - Current JSON: Balance stored in transaction record
   - Supabase schema: Balance calculated from ledger, customer.points_balance is denormalized cache
   - Migration strategy: Recalculate all balances from transaction history during migration

4. **Settings Storage**
   - Current JSON: Settings stored in `loyalty-store.json`
   - Supabase schema: Settings table not defined
   - Migration strategy: Create `settings` table or use tenant-level settings

## Row Level Security (RLS) Requirements

### Current RLS Status
All tables have RLS enabled, but policies need to be reviewed and implemented.

### Required RLS Policies

1. **customers table**
   ```sql
   -- Staff can only view customers from their tenant
   CREATE POLICY "Staff can view customers" 
   ON customers FOR SELECT 
   USING (tenant_id = auth.jwt()->>'tenant_id');
   
   -- Staff can insert customers for their tenant
   CREATE POLICY "Staff can insert customers" 
   ON customers FOR INSERT 
   WITH CHECK (tenant_id = auth.jwt()->>'tenant_id');
   ```

2. **points_ledger table**
   ```sql
   -- Staff can view ledger for their tenant
   CREATE POLICY "Staff can view ledger" 
   ON points_ledger FOR SELECT 
   USING (tenant_id = auth.jwt()->>'tenant_id');
   
   -- Staff can insert ledger entries for their tenant
   CREATE POLICY "Staff can insert ledger" 
   ON points_ledger FOR INSERT 
   WITH CHECK (tenant_id = auth.jwt()->>'tenant_id');
   ```

3. **loyalty_cards table**
   ```sql
   -- Staff can view cards for their tenant
   CREATE POLICY "Staff can view cards" 
   ON loyalty_cards FOR SELECT 
   USING (tenant_id = auth.jwt()->>'tenant_id');
   
   -- Staff can update cards for their tenant
   CREATE POLICY "Staff can update cards" 
   ON loyalty_cards FOR UPDATE 
   USING (tenant_id = auth.jwt()->>'tenant_id');
   ```

4. **audit_log table**
   ```sql
   -- Staff can view audit logs for their tenant
   CREATE POLICY "Staff can view audit logs" 
   ON audit_log FOR SELECT 
   USING (tenant_id = auth.jwt()->>'tenant_id');
   
   -- System can insert audit logs
   CREATE POLICY "System can insert audit logs" 
   ON audit_log FOR INSERT 
   WITH CHECK (true);
   ```

## Tenant Isolation Requirements

### Current Implementation
- JSON backend: Single-tenant (no isolation needed)
- Supabase backend: Multi-tenant architecture designed

### Migration Requirements
1. Ensure all queries include `tenant_id` filter
2. Verify RLS policies enforce tenant isolation
3. Test cross-tenant data access prevention
4. Implement tenant context from JWT claims

## Authentication Dependencies

### Current Implementation
- JSON backend: No authentication (development mode)
- Supabase backend: Designed for Supabase Auth integration

### Migration Requirements
1. Configure Supabase Auth with custom JWT claims
2. Implement `tenant_id` in JWT token
3. Update middleware to extract tenant context
4. Add authentication flows for staff users
5. Implement session management

### Required JWT Structure
```json
{
  "sub": "user_uuid",
  "tenant_id": "tenant_uuid",
  "role": "cashier|manager|admin",
  "branch_id": "branch_uuid" // optional
}
```

## Known Migration Risks

### High Risk Items

1. **Data Type Inconsistencies**
   - Risk: JSON uses loose typing, Supabase uses strict SQL types
   - Mitigation: Validate all data types before migration
   - Test: Run data validation scripts on JSON data

2. **Balance Calculation**
   - Risk: Ledger-based balance calculation may differ from JSON stored values
   - Mitigation: Recalculate all balances from transaction history
   - Test: Compare JSON balances with calculated balances before migration

3. **Transaction Idempotency**
   - Risk: Current JSON implementation uses in-memory idempotency
   - Mitigation: Supabase implementation uses database-level constraints
   - Test: Verify idempotency keys are unique across systems

4. **Audit Log Consistency**
   - Risk: New feature, no historical audit logs in JSON
   - Mitigation: Start audit logging fresh after migration
   - Test: Verify audit log creation for all mutations

### Medium Risk Items

1. **Customer Name Display**
   - Risk: UI expects split names, Supabase stores full name
   - Mitigation: Update UI to handle both formats during transition
   - Test: Verify customer display in all UI components

2. **Card Assignment Business Logic**
   - Risk: Different assignment logic between backends
   - Mitigation: Standardize business logic in service layer
   - Test: Verify card assignment prevents duplicates

3. **Settings Management**
   - Risk: Settings table not defined in original schema
   - Mitigation: Create settings table and migrate JSON settings
   - Test: Verify settings persistence and retrieval

### Low Risk Items

1. **API Endpoint Compatibility**
   - Risk: API response formats may differ slightly
   - Mitigation: Use legacy type adapters where needed
   - Test: Verify API contracts remain stable

2. **Performance Characteristics**
   - Risk: Database queries may have different performance
   - Mitigation: Add database indexes for common queries
   - Test: Load test critical endpoints

## Migration Implementation Plan

### Phase 1: Schema Preparation
1. Add missing tables (idempotency_records, settings)
2. Create RLS policies for all tables
3. Add database indexes for performance
4. Test schema with sample data

### Phase 2: Data Migration
1. Export JSON data to intermediate format
2. Transform data to match Supabase schema
3. Validate data integrity
4. Import to Supabase staging environment
5. Verify data counts and relationships

### Phase 3: Code Migration
1. Update repository imports to use Supabase implementations
2. Add authentication middleware
3. Update tenant context extraction
4. Test all workflows with Supabase backend

### Phase 4: Validation & Testing
1. Run integration tests against Supabase
2. Perform user acceptance testing
3. Load test critical endpoints
4. Validate audit log creation
5. Test idempotency protection

### Phase 5: Cutover
1. Schedule maintenance window
2. Perform final data sync
3. Switch backend configuration
4. Monitor for errors
5. Rollback plan if needed

## Post-Migration Checklist

- [ ] All workflows functional with Supabase backend
- [ ] Audit logs being created for all mutations
- [ ] Idempotency protection working correctly
- [ ] Tenant isolation enforced
- [ ] Authentication flows working
- [ ] Performance acceptable
- [ ] Error handling production-friendly
- [ ] Data integrity verified
- [ ] Rollback plan tested
- [ ] Documentation updated

## Conclusion

The Supermed Loyalty System is well-architected for Supabase migration. The clean repository pattern separation makes the backend swap straightforward. The main risks are around data transformation and ensuring business logic consistency between the two implementations.

**Recommendation**: Proceed with migration after completing the schema additions and running comprehensive data validation tests.
