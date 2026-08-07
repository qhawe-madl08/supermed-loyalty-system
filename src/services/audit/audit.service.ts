import { createSupabaseServerClient } from '@/lib/auth';
import { getAuthenticatedTenantId, getAuthenticatedStaffId, getAuthenticatedBranchId } from '@/lib/tenant-helper';

export interface AuditEvent {
  action: string;
  entityType: string;
  entityId?: string;
  before?: Record<string, any>;
  after?: Record<string, any>;
  result?: 'success' | 'failure' | 'partial';
  metadata?: Record<string, any>;
}

/**
 * Centralized audit logging service
 * 
 * All critical business actions must call this service to maintain
 * a complete audit trail for the pharmacy loyalty system.
 */
export async function logAuditEvent(event: AuditEvent): Promise<void> {
  try {
    const tenantId = await getAuthenticatedTenantId();
    const staffId = await getAuthenticatedStaffId();
    const branchId = await getAuthenticatedBranchId();

    if (!tenantId) {
      console.error('Audit logging failed: No tenant context');
      return;
    }

    const supabase = createSupabaseServerClient();

    // Get staff role from JWT claims if available
    // Note: This requires the auth_helper or similar to extract role from session
    // For now, we'll log what we have and can enhance role extraction later
    const actorRole = 'unknown'; // TODO: Extract from JWT claims

    const { error } = await supabase
      .from('audit_log')
      .insert({
        tenant_id: tenantId,
        branch_id: branchId,
        actor_staff_id: staffId,
        actor_role: actorRole,
        action: event.action,
        entity_type: event.entityType,
        entity_id: event.entityId || null,
        before: event.before || null,
        after: event.after || null,
        result: event.result || 'success',
        metadata: event.metadata || null,
      });

    if (error) {
      console.error('Failed to log audit event:', error);
      // Do not throw - audit logging failure should not break business operations
    }
  } catch (error) {
    console.error('Audit logging exception:', error);
    // Do not throw - audit logging failure should not break business operations
  }
}

/**
 * Convenience function for customer-related audits
 */
export async function logCustomerEvent(
  action: 'created' | 'updated' | 'archived' | 'restored',
  customerId: string,
  before?: Record<string, any>,
  after?: Record<string, any>,
  result: 'success' | 'failure' = 'success'
): Promise<void> {
  await logAuditEvent({
    action: `customer_${action}`,
    entityType: 'customer',
    entityId: customerId,
    before,
    after,
    result,
  });
}

/**
 * Convenience function for card-related audits
 */
export async function logCardEvent(
  action: 'assigned' | 'status_changed' | 'replaced' | 'frozen' | 'revoked',
  cardId: string,
  before?: Record<string, any>,
  after?: Record<string, any>,
  result: 'success' | 'failure' = 'success'
): Promise<void> {
  await logAuditEvent({
    action: `card_${action}`,
    entityType: 'card',
    entityId: cardId,
    before,
    after,
    result,
  });
}

/**
 * Convenience function for transaction-related audits
 */
export async function logTransactionEvent(
  action: 'purchase' | 'redemption' | 'correction' | 'reversal',
  transactionId: string,
  before?: Record<string, any>,
  after?: Record<string, any>,
  result: 'success' | 'failure' = 'success'
): Promise<void> {
  await logAuditEvent({
    action: `transaction_${action}`,
    entityType: 'transaction',
    entityId: transactionId,
    before,
    after,
    result,
  });
}

/**
 * Convenience function for authentication-related audits
 */
export async function logAuthEvent(
  action: 'login' | 'logout' | 'failed_login',
  userId?: string,
  metadata?: Record<string, any>,
  result: 'success' | 'failure' = 'success'
): Promise<void> {
  await logAuditEvent({
    action: `auth_${action}`,
    entityType: 'auth',
    entityId: userId,
    result,
    metadata,
  });
}
