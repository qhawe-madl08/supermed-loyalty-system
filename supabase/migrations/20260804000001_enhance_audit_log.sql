-- Enhance audit_log table for comprehensive audit logging
-- Add missing fields for branch, role, result, and metadata

ALTER TABLE audit_log
ADD COLUMN branch_id UUID,
ADD COLUMN actor_role TEXT,
ADD COLUMN result TEXT,
ADD COLUMN metadata JSONB;

-- Add indexes for common queries
CREATE INDEX idx_audit_log_tenant_id ON audit_log(tenant_id);
CREATE INDEX idx_audit_log_actor_staff_id ON audit_log(actor_staff_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX idx_audit_log_action ON audit_log(action);

-- Add comment
COMMENT ON TABLE audit_log IS 'Centralized audit log for all critical business actions in the Supermed loyalty system';
