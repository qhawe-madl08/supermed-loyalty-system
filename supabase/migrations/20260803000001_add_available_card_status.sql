-- Migration: Add AVAILABLE status to card_status enum for physical card inventory
-- This enables the scan-first workflow where physical cards exist before customer registration

-- Add 'available' status to card_status enum
ALTER TYPE card_status ADD VALUE IF NOT EXISTS 'available';

-- Modify loyalty_cards.customer_id to be nullable for available cards
ALTER TABLE loyalty_cards ALTER COLUMN customer_id DROP NOT NULL;

-- Add constraint: customer_id must be NOT NULL when status is not 'available'
ALTER TABLE loyalty_cards ADD CONSTRAINT check_customer_id_for_active_cards
CHECK (
  (status = 'available' AND customer_id IS NULL) OR
  (status != 'available' AND customer_id IS NOT NULL)
);

-- Add comment to document the card lifecycle
COMMENT ON COLUMN loyalty_cards.status IS 'Card lifecycle: available (in inventory, unassigned) → active (assigned to customer) → lost/frozen/replaced/revoked (special states)';
COMMENT ON COLUMN loyalty_cards.customer_id IS 'Customer ID (NULL for available cards in inventory)';
