-- Add soft-delete capability to customers table
-- Historical transactions and loyalty records must remain intact

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by UUID;

-- Add index for querying active customers efficiently
CREATE INDEX IF NOT EXISTS idx_customers_is_active ON customers(deleted_at) WHERE deleted_at IS NULL;

-- Add comment
COMMENT ON COLUMN customers.deleted_at IS 'Timestamp for soft-delete. NULL means customer is active.';
COMMENT ON COLUMN customers.deleted_by IS 'Staff user ID who archived the customer.';
