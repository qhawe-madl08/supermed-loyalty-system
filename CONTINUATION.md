# PHASE 1 AUDIT REPORT: QR Payload Architecture & System State

## AUDIT FINDINGS

### 1. QR PAYLOAD ARCHITECTURE ✅ CORRECT

**Current Implementation:**
- Scanner uses `@zxing/browser` - decodes ANY QR code successfully
- Scanner extracts raw text payload via `result.getText()`
- Scanner sends decoded text to `/api/cards/lookup?code={payload}`
- `/api/cards/lookup` queries `loyalty_cards` table where `card_code = payload`
- If card exists → returns status (available/active/lost/frozen/replaced/revoked)
- If card does not exist → returns 404

**Database Schema:**
- `loyalty_cards.card_code` (text) - stores the QR payload
- `loyalty_cards.card_type` (enum: qr, barcode, virtual)
- `loyalty_cards.status` (enum: active, lost, frozen, replaced, revoked, available)
- `loyalty_cards.customer_id` (uuid, nullable) - null for available cards

**Production Cards:**
- SM000001: status=active, customer_id=fe4b401f-c8a2-461f-a1ff-137c7536018e (already assigned)
- SM000002-SM000010: status=available, customer_id=null (ready for assignment)

**CONCLUSION:** The QR payload architecture is CORRECT. The scanner:
1. Decodes ANY QR (ZXing is general-purpose)
2. Sends payload to lookup API
3. Lookup API checks if it exists in Supermed inventory
4. Returns appropriate status or 404

**NO MISMATCH DETECTED** between:
- QR payload format (plain text: "SM000001")
- Database card_code field
- Scanner expectation
- API expectation

**SECURITY NOTE:** The current architecture uses predictable sequential card IDs (SM000001-SM000010). This is acceptable for STAFF scanning but NOT secure for public customer balance lookup. Public customer experience must use a separate secure token architecture.

---

### 2. STAFF PORTAL IDENTITY ❌ INCORRECT

**Current State:**
- Root page (`/`) looks like a PUBLIC marketing landing page
- Copy: "Join Our Loyalty Program", "Get Started", "Why Choose Supermed Pharmacy?"
- Design: Hero banner, feature sections, location info, footer
- This is NOT appropriate for an internal staff service platform

**Required Change:**
- Root page should be STAFF-ONLY or redirect to login
- Copy should reflect internal operations
- Remove public marketing language from staff portal

---

### 3. ROLE-AWARE LANDING ❌ NOT IMPLEMENTED

**Current State:**
- Login always redirects to `/dashboard` (line 36 in login/page.tsx)
- No role detection in login flow
- Cashiers, managers, admins, owners all land on dashboard

**Required Change:**
- Implement role detection after login
- Cashier → `/scan`
- Manager/Admin/Owner → `/dashboard`

---

### 4. MOBILE NAVIGATION ❌ OVERFLOW ISSUE

**Current State:**
- Dashboard header has horizontal overflow on mobile
- Navigation buttons extend beyond viewport
- No hamburger menu
- No mobile-optimized navigation

**Required Change:**
- Implement mobile-first navigation shell
- Add hamburger menu for mobile
- Compact header for mobile
- Role-aware navigation drawer

---

### 5. HOME NAVIGATION ❌ INCONSISTENT

**Current State:**
- Logo click not implemented (no click handler)
- No centralized home resolver
- No role-aware home routing

**Required Change:**
- Implement logo click → role-appropriate home
- Cashier → `/scan`
- Manager/Admin/Owner → `/dashboard`
- Add Home button to mobile menu

---

### 6. TRANSACTION HISTORY ❌ BROKEN NAVIGATION

**Current State:**
- Customer profile "View All" button (line 217 in customers/[id]/page.tsx)
- Calls `setActiveTab('history')` - this is CORRECT
- History tab shows full transaction list
- This is NOT broken - previous report was incorrect

**Verification:** The "View All" navigation IS correct. It switches to the history tab which displays actual transactions.

---

### 7. AUDIT LOGGING ❌ NOT IMPLEMENTED

**Current State:**
- `audit_log` table exists but is EMPTY
- Schema: id, tenant_id, actor_staff_id, action, entity_type, entity_id, before, after, created_at
- Missing fields: branch_id, actor_role, result/status
- NO INSERT policy exists
- No centralized audit service
- No audit calls in any actions

**Required Changes:**
- Add branch_id, actor_role, result/status columns
- Create INSERT policy
- Implement centralized audit service
- Add audit calls to all critical actions

---

### 8. CUSTOMER DELETE/ARCHIVE ❌ NOT IMPLEMENTED

**Current State:**
- `customers` table has `is_active` (boolean) but NO `deleted_at` (timestamp)
- No delete/archive functionality in UI
- No API endpoints for deletion
- No confirmation dialogs
- No role-based permissions

**Required Changes:**
- Add `deleted_at` timestamp column for soft-delete
- Implement delete/archive API
- Add confirmation dialog
- Add role permission checks
- Add audit logging

---

### 9. ABANDONED FORM PROTECTION ❌ NOT IMPLEMENTED

**Current State:**
- No unsaved form detection
- No confirmation before leaving forms
- No browser navigation handling

**Required Change:**
- Implement form dirty state tracking
- Add confirmation dialog on navigation
- Handle browser back button where possible

---

### 10. LOGO CONSISTENCY ✅ GOOD

**Current State:**
- All pages use `/media/logo.png`
- Consistent Image component usage
- Proper alt text

**No changes required.**

---

### 11. CARD ONBOARDING ✅ IMPLEMENTED

**Current State:**
- `/card-onboarding` page exists
- Shows card number and status
- Three actions: Register Customer, Check Card, Cancel
- Mobile-first design

**Minor Improvement:**
- "Check Card" currently returns to scan (placeholder)
- Could show actual card details in future

---

### 12. SCANNER UX ✅ GOOD

**Current State:**
- Rear camera detection
- Visual scanning frame
- Haptic feedback
- Duplicate scan prevention
- Manual entry fallback
- Clear error messages

**No changes required.**

---

### 13. QR ERROR STATES ✅ CORRECT

**Current State:**
- Camera error: "Failed to start camera. Please check permissions and try again."
- 404: "Card not recognized. This card is not registered in the Supermed system."
- Lost: "This card has been reported as lost. Please contact your manager."
- Frozen: "This card is temporarily frozen. Please contact your manager."
- Replaced: "This card has been replaced. Please contact your manager."
- Revoked: "This card has been revoked. Please contact your manager."

**No changes required.** Distinguishes all states correctly.

---

### 14. SECURITY: UNKNOWN QR CODES ✅ CORRECT

**Current State:**
- Scanner does NOT redirect to external URLs
- Unknown QR returns 404 with clear message
- Staff scanner is NOT a generic QR browser

**No changes required.**

---

### 15. CUSTOMER/STAFF ROUTING ⚠️ PARTIAL

**Current State:**
- Staff routes: /login, /scan, /dashboard, /customers, /workflows
- No public customer routes yet (intentional)
- This is CORRECT for current phase

**Future Work:**
- Public customer experience with secure token architecture
- Separate /card/[public-token] route
- Do not expose staff APIs to public

---

### 16. ATOMIC CUSTOMER + CARD ASSIGNMENT ❌ NOT ATOMIC

**Current State:**
- Customer creation and card assignment are separate operations
- Risk: Customer created, card assignment fails → orphan customer
- No database transaction wrapping both operations

**Required Change:**
- Create Supabase RPC function
- Wrap customer creation + card assignment in single transaction
- Roll back all on failure

---

### 17. OFFLINE FOUNDATION ❌ NOT IMPLEMENTED

**Current State:**
- No offline queue abstraction
- No sync status tracking
- No device/session identification

**Required Changes:**
- Design offline queue architecture
- Create clean abstractions
- Do not implement full sync yet

---

### 18. PWA PREPARATION ❌ NOT IMPLEMENTED

**Current State:**
- No web app manifest
- No service worker
- No PWA metadata

**Required Changes:**
- Create manifest
- Add service worker architecture
- Add viewport/mobile metadata

---

### 19. RBAC RUNTIME TESTING ❌ NOT DONE

**Current State:**
- Only SQL policy inspection done
- No actual runtime testing with different roles
- No dedicated test accounts

**Required Change:**
- Create test accounts for each role
- Actually test permissions
- Document results

---

## IMPLEMENTATION PLAN

### WHAT IS ALREADY WORKING ✅
- QR decoding (ZXing)
- Card lookup API
- Universal scan decision engine
- Card onboarding screen
- Customer profile dashboard
- Purchase/redemption workflows
- Points calculation
- Card inventory
- Authentication
- RLS tenant isolation
- Mobile scanner UX
- Error state handling
- Logo consistency

### WHAT IS BROKEN ❌
- Root page is public-facing (should be staff-only)
- No role-aware landing (cashiers go to dashboard instead of scan)
- Mobile navigation overflows
- No home navigation (logo click does nothing)
- Audit logging not implemented
- Customer delete/archive not implemented
- No abandoned form protection
- Customer + card assignment not atomic
- No offline foundation
- No PWA preparation
- No RBAC runtime testing

### WHAT WILL CHANGE

**PHASE 1 (COMPLETE):** Audit - Done ✅

**PHASE 2: Fix QR payload/scanning interpretation**
- STATUS: Already correct, no changes needed
- Scanner properly distinguishes: QR decoded vs. card exists
- Error messages are appropriate

**PHASE 3: Universal scan decision architecture**
- STATUS: Already implemented ✅
- Available → onboarding
- Active → customer profile
- Unknown → 404 error
- Lost/frozen/replaced/revoked → specific errors

**PHASE 4: Role-aware landing**
- Modify `/api/auth/login` to detect role
- Redirect cashier → `/scan`
- Redirect manager/admin/owner → `/dashboard`
- Files: `src/app/api/auth/login/route.ts`, `src/app/login/page.tsx`

**PHASE 5: Mobile application shell/navigation**
- Create mobile navigation component
- Add hamburger menu
- Fix header overflow
- Implement role-aware navigation drawer
- Files: New component, update all pages

**PHASE 6: Customer profile navigation and transaction history**
- STATUS: Already correct ✅
- "View All" switches to history tab properly
- No changes needed

**PHASE 7: Abandonment protection**
- Implement form dirty state tracking
- Add confirmation dialog component
- Integrate into all forms
- Files: New component, update forms

**PHASE 8: Centralized audit logging**
- Add migration: branch_id, actor_role, result/status to audit_log
- Create INSERT policy
- Implement audit service
- Add audit calls to critical actions
- Files: Migration, new service, update actions

**PHASE 9: Customer soft-delete/archive**
- Add migration: deleted_at to customers
- Implement delete/archive API
- Add confirmation dialog
- Add role permission checks
- Add audit logging
- Files: Migration, API routes, UI components

**PHASE 10: Atomic customer + card assignment**
- Create Supabase RPC function
- Wrap registration in transaction
- Update enrollment workflow
- Files: Migration, RPC, update action

**PHASE 11: Runtime RBAC testing**
- Create test accounts
- Document test procedure
- Test each role
- Document results
- Files: Test script, documentation

**PHASE 12: Offline foundation**
- Design offline queue architecture
- Create type definitions
- Create service interface
- Files: New types, new service interface

**PHASE 13: PWA preparation**
- Create manifest.json
- Add service worker
- Add metadata to layout
- Files: manifest.json, service worker, layout.tsx

**PHASE 14: Root page/staff-facing copy**
- Rewrite root page as staff-only or redirect
- Update all copy to reflect internal operations
- Remove public marketing language
- Files: src/app/page.tsx

### DATABASE MIGRATIONS REQUIRED

1. **audit_log enhancement:**
   - Add `branch_id` (uuid, nullable)
   - Add `actor_role` (text)
   - Add `result` (text)
   - Add `status` (text)

2. **customers soft-delete:**
   - Add `deleted_at` (timestamp with time zone, nullable)

3. **Atomic registration RPC:**
   - Create function `register_customer_with_card(tenant_id, customer_data, card_code)`

### FILES LIKELY TO CHANGE

**API Routes:**
- `src/app/api/auth/login/route.ts` - Add role detection
- `src/app/api/customers/[id]/route.ts` - Add delete/archive
- New: `src/app/api/audit/log/route.ts` - Audit logging

**Pages:**
- `src/app/login/page.tsx` - Handle role-based redirect
- `src/app/page.tsx` - Rewrite as staff-only
- `src/app/customers/[id]/page.tsx` - Add delete/archive button
- All pages - Add mobile navigation component

**Components:**
- New: `src/components/mobile-navigation.tsx`
- New: `src/components/abandonment-dialog.tsx`
- New: `src/components/logo.tsx` (if not exists)

**Services:**
- New: `src/services/audit/audit.service.ts`
- Update: `src/app/actions/customer-actions.ts` - Add audit calls
- Update: `src/app/actions/transaction-actions.ts` - Add audit calls

**Database:**
- New: `supabase/migrations/xxxxx_enhance_audit_log.sql`
- New: `supabase/migrations/xxxxx_add_customer_deleted_at.sql`
- New: `supabase/migrations/xxxxx_atomic_registration_rpc.sql`

### RISKS

**Low Risk:**
- Role-aware landing (simple redirect logic)
- Mobile navigation (UI only, no data changes)
- Logo component (refactoring only)
- Abandonment protection (UI only)

**Medium Risk:**
- Audit logging (database schema change, many integration points)
- Customer soft-delete (database schema change, data preservation)

**High Risk:**
- Atomic customer + card assignment (database RPC, transaction logic)
- Must test thoroughly to ensure no data loss

**No Risk:**
- QR scanner (already working correctly)
- Transaction history (already working correctly)
- Card onboarding (already working correctly)

---

## NEXT STEPS

Proceed with PHASE 4 (Role-aware landing) as all audit findings are documented and PHASES 1-3 are already complete or correct.
